import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { parseFeatureHistory, parseFeatureRecords } from '@/lib/version-plan';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Check, CheckCircle2, Clock3, Eye, FileImage, GitBranch, History,
  LockKeyhole, Pencil, Plus, Save, Trash2, Upload,
} from 'lucide-react';

const statusClasses = {
  active: 'border-primary/30 bg-primary/10 text-primary',
  completed: 'border-green-200 bg-green-50 text-green-700',
  locked: 'border-border bg-muted text-muted-foreground',
};

function featureSourceLabel(feature) {
  if (feature.source === 'ai' && feature.edited) return 'AI edited';
  if (feature.source === 'ai') return feature.accepted ? 'AI kept' : 'AI suggestion';
  if (feature.source === 'starter') return feature.accepted ? 'Starter kept' : 'Starter suggestion';
  if (feature.source === 'planned') return feature.accepted ? 'Planned feature' : 'Planned suggestion';
  if (feature.source === 'user') return 'User added';
  return feature.edited ? 'Edited' : 'Existing feature';
}

function nextVersionLabel(versions) {
  const highestMinor = versions.reduce((highest, version) => {
    const match = String(version.label || '').match(/v0\.(\d+)/i);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `v0.${highestMinor + 1}`;
}

function buildDraft(version) {
  return {
    versionId: version.id,
    label: version.label,
    notes: version.notes || '',
    features: parseFeatureRecords(version.features, version.feature_meta),
  };
}

export default function ProjectVersions() {
  const { id: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isReadOnly = searchParams.get('mode') === 'view';

  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [newFeature, setNewFeature] = useState('');
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionConfirmed, setCompletionConfirmed] = useState(false);
  const [completionDuration, setCompletionDuration] = useState('');
  const [verificationImage, setVerificationImage] = useState('');
  const [verificationFileName, setVerificationFileName] = useState('');
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [newVersionFeatures, setNewVersionFeatures] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', String(projectId)],
    queryFn: async () => {
      const response = await api.get('/saved-projects');
      return response.data.find((item) => String(item.id) === String(projectId)) || null;
    },
  });

  const { data: versions = [], isLoading, isError } = useQuery({
    queryKey: ['versions', String(projectId)],
    queryFn: async () => (await api.get(`/project-versions/${projectId}`)).data,
  });

  const selectedVersion = useMemo(
    () => versions.find((version) => String(version.id) === String(selectedId)) || null,
    [selectedId, versions]
  );
  const activeVersion = versions.find((version) => version.status === 'active') || null;
  const canEditSelected = !isReadOnly && selectedVersion?.status === 'active';
  const allCompleted = versions.length > 0 && versions.every((version) => version.status === 'completed');

  useEffect(() => {
    if (versions.length === 0) return;
    if (selectedId && versions.some((version) => String(version.id) === String(selectedId))) return;
    setSelectedId(activeVersion?.id || versions.filter((version) => version.status === 'completed').at(-1)?.id || versions[0].id);
  }, [activeVersion?.id, selectedId, versions]);

  useEffect(() => {
    setDraft(null);
    setNewFeature('');
  }, [selectedId]);

  const invalidateVersions = () => queryClient.invalidateQueries({ queryKey: ['versions', String(projectId)] });

  const saveMutation = useMutation({
    mutationFn: async (payload) => (await api.put(`/project-versions/${selectedVersion.id}`, payload)).data,
    onSuccess: () => {
      setDraft(null);
      invalidateVersions();
      toast({ title: 'Version saved', description: 'The project card now uses these updated features.' });
    },
    onError: (error) => toast({ title: 'Could not save version', description: error.response?.data?.error || error.message, variant: 'destructive' }),
  });

  const completeMutation = useMutation({
    mutationFn: async () => (await api.post(`/project-versions/${selectedVersion.id}/complete`, {
      confirmation: true,
      completion_duration: completionDuration,
      verification_image: verificationImage,
    })).data,
    onSuccess: (result) => {
      setCompletionOpen(false);
      setCompletionConfirmed(false);
      setCompletionDuration('');
      setVerificationImage('');
      setVerificationFileName('');
      setSelectedId(result.activeVersionId || result.completedVersionId);
      invalidateVersions();
      toast({ title: result.activeVersionId ? 'Next version unlocked' : 'Version completed', description: result.activeVersionId ? 'The next version is now active.' : 'All planned versions are complete.' });
    },
    onError: (error) => toast({ title: 'Could not complete version', description: error.response?.data?.error || error.message, variant: 'destructive' }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const featureRecords = newVersionFeatures.split('\n').map((text) => text.trim()).filter(Boolean).map((text) => ({
        id: `feature-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        source: 'user',
        accepted: true,
        completed: false,
      }));
      return (await api.post('/project-versions', {
        project_id: projectId,
        label: newVersionLabel.trim() || nextVersionLabel(versions),
        notes: newVersionNotes.trim(),
        feature_records: featureRecords,
      })).data;
    },
    onSuccess: (created) => {
      setShowAddVersion(false);
      setNewVersionNotes('');
      setNewVersionFeatures('');
      setSelectedId(created.id);
      invalidateVersions();
      toast({ title: 'New active version created' });
    },
    onError: (error) => toast({ title: 'Could not create version', description: error.response?.data?.error || error.message, variant: 'destructive' }),
  });

  const startEditing = () => {
    if (selectedVersion?.status === 'active') setDraft(buildDraft(selectedVersion));
  };

  const updateDraft = (update) => setDraft((current) => current ? { ...current, ...update } : current);

  const updateFeature = (featureId, update) => updateDraft({
    features: draft.features.map((feature) => feature.id === featureId ? { ...feature, ...update } : feature),
  });

  const deleteFeature = (featureId) => updateDraft({
    features: draft.features.filter((feature) => feature.id !== featureId),
  });

  const addFeature = () => {
    const text = newFeature.trim();
    if (!text || !draft) return;
    updateDraft({
      features: [...draft.features, {
        id: `feature-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        source: 'user',
        accepted: true,
        completed: false,
        edited: false,
        originalText: null,
      }],
    });
    setNewFeature('');
  };

  const saveDraft = () => {
    if (!draft) return;
    saveMutation.mutate({ label: draft.label, notes: draft.notes, feature_records: draft.features });
  };

  const openCompletion = () => {
    if (draft) {
      toast({ title: 'Save your changes first', description: 'Save feature changes before completing this version.', variant: 'destructive' });
      return;
    }
    setCompletionConfirmed(false);
    setCompletionDuration('');
    setVerificationImage('');
    setVerificationFileName('');
    setCompletionOpen(true);
  };

  const selectProofImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toast({ title: 'Upload a valid image', description: 'Choose a PNG, JPG, WEBP, or similar image smaller than 5 MB.', variant: 'destructive' });
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setVerificationImage(String(reader.result || ''));
      setVerificationFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  console.log("CURRENT PROJECTVERSIONS FILE LOADED");
  let displayFeatures = [];

if (draft && draft.versionId === selectedVersion?.id) {
  displayFeatures = draft.features || [];
} else if (selectedVersion) {
  displayFeatures = parseFeatureRecords(
    selectedVersion.features,
    selectedVersion.feature_meta
  );
}
  const featureHistory = selectedVersion ? parseFeatureHistory(selectedVersion.feature_history) : [];

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><History className="h-7 w-7 animate-pulse text-primary" /></div>;
  if (isError || !project) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">Could not load Version History for this project.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/saved')} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Projects
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h1 className="truncate text-2xl font-extrabold tracking-tight">{project.title}</h1>
            <Badge variant="outline" className={isReadOnly ? 'text-muted-foreground' : 'border-primary/30 text-primary'}>{isReadOnly ? 'Read-only' : 'Editable view'}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Complete project history and the current version plan.</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(isReadOnly ? `/versions/${projectId}` : `/versions/${projectId}?mode=view`)}>
          {isReadOnly ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {isReadOnly ? 'Edit mode' : 'Read-only'}
        </Button>
      </header>

      {allCompleted && !isReadOnly && (
        <section className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">All planned versions are complete</h2>
              <p className="text-sm text-muted-foreground">Add the next manually planned version when you are ready to continue.</p>
            </div>
            <Button size="sm" onClick={() => { setNewVersionLabel(nextVersionLabel(versions)); setShowAddVersion(true); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Version</Button>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Version History</p>
          <div className="space-y-2">
            {versions.map((version) => {
              const selected = String(version.id) === String(selectedId);
              return (
                <button
                  key={version.id}
                  onClick={() => setSelectedId(version.id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${selected ? 'border-primary/30 bg-primary/10' : 'border-border hover:bg-muted/60'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{version.label}</span>
                    {version.status === 'locked' ? <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" /> : <GitBranch className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span className={`mt-1 inline-block text-[10px] font-medium capitalize ${version.status === 'completed' ? 'text-green-600' : version.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>{version.status}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {selectedVersion && (
          <main className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-2xl font-bold">Version {selectedVersion.label.replace(/^v/i, '')}</h2>
                  <Badge className={statusClasses[selectedVersion.status] || statusClasses.locked}>{selectedVersion.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{selectedVersion.status === 'active' ? 'This is the current version shown on the project card.' : selectedVersion.status === 'completed' ? 'Completed history is preserved and cannot be changed.' : 'This plan is visible but remains unavailable until the prior version is completed.'}</p>
              </div>
              <div className="flex gap-2">
                {canEditSelected && !draft && <Button size="sm" variant="outline" onClick={startEditing} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit version</Button>}
                {canEditSelected && <Button size="sm" onClick={openCompletion} disabled={Boolean(draft)} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Complete version</Button>}
              </div>
            </div>

            <section className="mb-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Everything to build in this version · {displayFeatures.filter((feature) => feature.completed).length}/{displayFeatures.length} built</h3>
                {draft && <span className="text-xs text-primary">Changes are not saved yet</span>}
              </div>
              <div className="space-y-2">
                {displayFeatures.length === 0 ? (
                  <p className="rounded-lg bg-muted/40 px-3 py-3 text-sm text-muted-foreground">No features are listed yet.</p>
                ) : displayFeatures.map((feature) => (
                  <div key={feature.id} className={`rounded-lg border px-3 py-2.5 ${feature.completed ? 'border-primary/15 bg-primary/5' : 'border-border bg-muted/20'}`}>
                    <div className="flex items-start gap-2">
                      {draft ? (
                        <button type="button" onClick={() => updateFeature(feature.id, { completed: !feature.completed })} className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${feature.completed ? 'border-primary bg-primary text-white' : 'border-border bg-card text-transparent'}`} title="Mark feature built">
                          <Check className="h-3 w-3" />
                        </button>
                      ) : (
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${feature.completed ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      )}
                      <div className="min-w-0 flex-1">
                        {draft ? (
                          <Input value={feature.text} onChange={(event) => updateFeature(feature.id, { text: event.target.value })} className="h-8 text-sm" aria-label="Feature text" />
                        ) : (
                          <p className={`text-sm ${feature.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{feature.text}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{featureSourceLabel(feature)}</Badge>
                          {!feature.accepted && draft && <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => updateFeature(feature.id, { accepted: true })}>Keep</Button>}
                          {feature.originalText && <span className="text-[10px] text-muted-foreground">Originally: {feature.originalText}</span>}
                        </div>
                      </div>
                      {draft && <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteFeature(feature.id)} title="Delete feature" aria-label={`Delete ${feature.text}`}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
              {draft && (
                <div className="mt-3 flex gap-2">
                  <Input value={newFeature} onChange={(event) => setNewFeature(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addFeature()} placeholder="Add a new feature…" className="h-9" />
                  <Button size="sm" variant="outline" onClick={addFeature} className="h-9 shrink-0 gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
                </div>
              )}
            </section>

            <section className="border-t border-border pt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Version details</h3>
                {draft && <span className="text-xs text-primary">Editable while this version is active</span>}
              </div>
              {draft ? (
                <div className="mb-5">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="version-label">Version label</label>
                  <Input id="version-label" value={draft.label} onChange={(event) => updateDraft({ label: event.target.value })} className="h-9 font-mono text-sm" maxLength={60} />
                </div>
              ) : (
                <p className="mb-5 text-sm text-muted-foreground">Label: <span className="font-mono text-foreground">{selectedVersion.label}</span></p>
              )}
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Version notes</h3>
              {draft ? <Textarea value={draft.notes} onChange={(event) => updateDraft({ notes: event.target.value })} className="min-h-[90px] text-sm" placeholder="Describe what changed in this version…" /> : <p className="rounded-lg bg-muted/30 px-3 py-2 text-sm leading-relaxed text-muted-foreground">{selectedVersion.notes || 'No version notes yet.'}</p>}
              {draft && (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
                  <Button size="sm" onClick={saveDraft} disabled={saveMutation.isPending} className="gap-1.5"><Save className="h-3.5 w-3.5" /> {saveMutation.isPending ? 'Saving…' : 'Save changes'}</Button>
                </div>
              )}
            </section>

            {selectedVersion.status === 'completed' && (
              <section className="mt-6 border-t border-border pt-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completion evidence</h3>
                <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> Time spent: {selectedVersion.completion_duration || 'Not recorded'}</p>
                {selectedVersion.verification_image && <img src={selectedVersion.verification_image} alt={`Completion proof for ${selectedVersion.label}`} className="max-h-72 rounded-lg border border-border object-contain" />}
              </section>
            )}

            {featureHistory.length > 0 && (
              <section className="mt-6 border-t border-border pt-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feature change log</h3>
                <ul className="space-y-1.5">
                  {featureHistory.map((entry) => (
                    <li key={entry.id} className="rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      <span className="font-medium capitalize text-foreground">{entry.action}</span>{' '}
                      {entry.action === 'edited' ? <><span className="line-through">{entry.from}</span> → {entry.text}</> : entry.text}
                      {entry.at && <span className="ml-2 text-xs text-muted-foreground/70">{new Date(entry.at).toLocaleString()}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>
        )}
      </div>

      <Dialog open={completionOpen} onOpenChange={setCompletionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete {selectedVersion?.label}</DialogTitle>
            <DialogDescription>Confirm completion, record the time spent, and upload a screenshot before the next version becomes active.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" checked={completionConfirmed} onChange={(event) => setCompletionConfirmed(event.target.checked)} className="mt-1" /> I confirm that this version is complete.</label>
            <div><label className="mb-1.5 block text-sm font-medium">How long did this version take?</label><Input value={completionDuration} onChange={(event) => setCompletionDuration(event.target.value)} placeholder="e.g. 6 hours or 3 days" /></div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Screenshot proof</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground hover:bg-muted/40"><Upload className="h-4 w-4" /> {verificationFileName || 'Upload image (max 5 MB)'}<input type="file" accept="image/*" onChange={selectProofImage} className="hidden" /></label>
              {verificationImage && <img src={verificationImage} alt="Selected completion proof" className="mt-3 max-h-40 rounded-lg border border-border object-contain" />}
            </div>
            <Button className="w-full gap-2" onClick={() => completeMutation.mutate()} disabled={!completionConfirmed || !completionDuration.trim() || !verificationImage || completeMutation.isPending}><FileImage className="h-4 w-4" /> {completeMutation.isPending ? 'Completing…' : 'Complete and unlock next version'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddVersion} onOpenChange={setShowAddVersion}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add the next version</DialogTitle><DialogDescription>Create a new active version after the three-stage plan is complete.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Input value={newVersionLabel} onChange={(event) => setNewVersionLabel(event.target.value)} placeholder="Version label" />
            <Textarea value={newVersionNotes} onChange={(event) => setNewVersionNotes(event.target.value)} placeholder="Version notes" />
            <Textarea value={newVersionFeatures} onChange={(event) => setNewVersionFeatures(event.target.value)} placeholder="Optional initial features, one per line" />
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating…' : 'Create active version'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

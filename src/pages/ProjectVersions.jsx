import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Save, Pencil, X, Check, GitBranch, Camera, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_FEATURES_BY_CATEGORY = {
  Web: ['User authentication', 'Responsive UI', 'REST API integration', 'Database persistence', 'Deployment setup'],
  Mobile: ['Cross-platform support', 'Push notifications', 'Offline mode', 'Social login', 'App store deployment'],
  'AI/ML': ['LLM API integration', 'Prompt engineering', 'Structured output parsing', 'Loading & streaming states', 'Result history'],
  CLI: ['Argument parsing', 'Config file support', 'Colorized output', 'Error handling', 'npm publishing'],
  Game: ['Game loop & state', 'Controls handling', 'Score tracking', 'Multiple levels', 'Sound & animations'],
  API: ['RESTful endpoints', 'Request validation', 'Auth & rate limiting', 'Auto-generated docs', 'CI/CD deployment'],
  Data: ['File upload & parsing', 'Interactive charts', 'Filtering & search', 'Export to CSV', 'Summary statistics'],
  DevOps: ['Automated monitoring', 'CLI tooling', 'Docker support', 'CI/CD integration', 'Logging & observability'],
  Other: ['Core feature', 'User-friendly UI', 'Data persistence', 'Error handling', 'Documentation'],
};

function getDefaultFeatures(category) {
  return DEFAULT_FEATURES_BY_CATEGORY[category] || DEFAULT_FEATURES_BY_CATEGORY.Other;
}

export default function ProjectVersions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editingFeatures, setEditingFeatures] = useState(false);
  const [localFeatures, setLocalFeatures] = useState([]);
  const [localNotes, setLocalNotes] = useState('');
  const [localLabel, setLocalLabel] = useState('');
  const [newFeatureText, setNewFeatureText] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null); // { label, notes, features: [{text, kept}] }
  const [aiLoading, setAiLoading] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.SavedProject.filter({ id }),
    select: (data) => data[0],
  });

  const { data: rawVersions = [], isLoading } = useQuery({
    queryKey: ['versions', id],
    queryFn: () => base44.entities.ProjectVersion.filter({ project_id: id }, 'created_date', 50),
  });

  // oldest → newest (ascending timeline)
  const versions = rawVersions;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectVersion.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['versions', id] });
      setShowNewForm(false);
      setNewVersionLabel('');
      setSelectedIdx(versions.length); // jump to new
      toast({ title: 'Version created!' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ vid, data }) => base44.entities.ProjectVersion.update(vid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', id] });
      setEditingFeatures(false);
      toast({ title: 'Version saved!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (vid) => base44.entities.ProjectVersion.delete(vid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', id] });
      setSelectedIdx(idx => Math.max(0, idx - 1));
      toast({ title: 'Version deleted' });
    },
  });

  const selectedVersion = versions[selectedIdx] || null;

  const startEdit = () => {
    if (!selectedVersion) return;
    setLocalFeatures(selectedVersion.features ? selectedVersion.features.split('\n').filter(Boolean) : []);
    setLocalNotes(selectedVersion.notes || '');
    setLocalLabel(selectedVersion.label || '');
    setEditingFeatures(true);
  };

  const cancelEdit = () => {
    setEditingFeatures(false);
    setNewFeatureText('');
  };

  const saveEdit = () => {
    if (!selectedVersion) return;
    updateMutation.mutate({
      vid: selectedVersion.id,
      data: { label: localLabel, features: localFeatures.join('\n'), notes: localNotes },
    });
  };

  const toggleFeature = (feat) => {
    // Features prefixed with "✓ " are "done", others are pending
    setLocalFeatures(prev =>
      prev.map(f => f === feat ? (f.startsWith('✓ ') ? f.slice(2) : '✓ ' + f) : f)
    );
  };

  const removeFeature = (feat) => {
    setLocalFeatures(prev => prev.filter(f => f !== feat));
  };

  const addFeature = () => {
    const trimmed = newFeatureText.trim();
    if (!trimmed) return;
    setLocalFeatures(prev => [...prev, trimmed]);
    setNewFeatureText('');
  };

  const handleCreate = () => {
    const count = versions.length + 1;
    const label = newVersionLabel.trim() || `v0.${count}`;
    const defaultFeatures = getDefaultFeatures(project?.category);
    createMutation.mutate({
      project_id: id,
      label,
      code: project?.code || '',
      language: project?.language || 'javascript',
      notes: '',
      features: defaultFeatures.join('\n'),
    });
  };

  const handleSnapshot = () => {
    const count = versions.length + 1;
    const label = `v0.${count} snapshot`;
    const prevFeatures = selectedVersion?.features || getDefaultFeatures(project?.category).join('\n');
    createMutation.mutate({
      project_id: id,
      label,
      code: project?.code || '',
      language: project?.language || 'javascript',
      notes: `Snapshot taken from ${selectedVersion?.label || 'current state'}`,
      features: prevFeatures,
    });
  };

  const handleAiSuggest = async () => {
    if (!project) return;
    setAiLoading(true);
    setAiSuggestions(null);
    const currentFeatures = selectedVersion?.features ? selectedVersion.features.split('\n').filter(Boolean).map(f => f.startsWith('✓ ') ? f.slice(2) : f) : [];
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are helping a developer plan the next version of their project.

Project: "${project.title}"
Description: "${project.description || ''}"
Category: "${project.category || ''}"
Tech stack: ${(project.tech_stack || []).join(', ') || 'unknown'}
Current features in this version: ${currentFeatures.length > 0 ? currentFeatures.join(', ') : 'none yet'}

Suggest a next version with:
1. A version label (e.g. v0.${versions.length + 1} or a meaningful name)
2. 5-7 concrete, actionable new features that logically build on or improve the existing ones
3. A short summary of what changed and why

Be specific and practical — each feature should be something a developer can actually implement.`,
      response_json_schema: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          notes: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    setAiSuggestions({
      label: result.label || `v0.${versions.length + 1} (AI)`,
      notes: result.notes || '',
      features: (result.features || []).map(text => ({ text, kept: true })),
    });
    setAiLoading(false);
  };

  const acceptAiSuggestions = () => {
    const keptFeatures = aiSuggestions.features.filter(f => f.kept).map(f => f.text);
    createMutation.mutate({
      project_id: id,
      label: aiSuggestions.label,
      code: project?.code || '',
      language: project?.language || 'javascript',
      notes: aiSuggestions.notes,
      features: keptFeatures.join('\n'),
    });
    setAiSuggestions(null);
  };

  const displayFeatures = editingFeatures
    ? localFeatures
    : (selectedVersion?.features ? selectedVersion.features.split('\n').filter(Boolean) : []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/saved')} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">{project?.title || 'Project'}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{versions.length} version{versions.length !== 1 ? 's' : ''} · Version history</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleSnapshot} disabled={createMutation.isPending}>
            <Camera className="w-3.5 h-3.5" /> Save Snapshot
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-primary/40 text-primary hover:bg-primary/10" onClick={handleAiSuggest} disabled={aiLoading || createMutation.isPending}>
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {aiLoading ? 'Generating...' : 'AI Suggest'}
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs bg-primary hover:bg-primary/90" onClick={() => setShowNewForm(v => !v)}>
            <Plus className="w-3.5 h-3.5" /> New Version
          </Button>
        </div>
      </div>

      {/* New version inline form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card border border-primary/30 rounded-xl p-4 flex gap-3 items-center">
              <Input
                placeholder={`e.g. v0.${versions.length + 1}`}
                value={newVersionLabel}
                onChange={e => setNewVersionLabel(e.target.value)}
                className="flex-1 h-9 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending} className="gap-1">
                <Check className="w-3.5 h-3.5" /> Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewForm(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestions review panel */}
      <AnimatePresence>
        {aiSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-gradient-to-br from-primary/5 to-accent/30 border border-primary/20 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-primary">AI-Suggested Version</p>
              </div>
              <button onClick={() => setAiSuggestions(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editable label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Label:</span>
              <input
                value={aiSuggestions.label}
                onChange={e => setAiSuggestions(s => ({ ...s, label: e.target.value }))}
                className="font-mono text-sm bg-card border border-border rounded px-2 py-0.5 outline-none focus:border-primary w-40"
              />
            </div>

            {/* Notes */}
            {aiSuggestions.notes && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mb-3 leading-relaxed italic">
                {aiSuggestions.notes}
              </p>
            )}

            {/* Feature review — toggle each keep/discard */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Review Features — click to keep or discard
            </p>
            <div className="space-y-1.5 mb-4">
              {aiSuggestions.features.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setAiSuggestions(s => ({
                    ...s,
                    features: s.features.map((feat, j) => j === i ? { ...feat, kept: !feat.kept } : feat),
                  }))}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all border ${
                    f.kept
                      ? 'bg-primary/8 border-primary/20 text-foreground'
                      : 'bg-muted/20 border-transparent text-muted-foreground line-through opacity-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${f.kept ? 'bg-primary border-primary' : 'border-border'}`}>
                    {f.kept && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-sm">{f.text}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-xs" onClick={acceptAiSuggestions} disabled={createMutation.isPending}>
                <Check className="w-3.5 h-3.5" />
                Create Version ({aiSuggestions.features.filter(f => f.kept).length} features)
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setAiSuggestions(null)}>
                Discard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading versions...</p>
      ) : versions.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-base">No versions yet</p>
          <p className="text-sm mt-1">Click "New Version" or "Save Snapshot" to capture the first state.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Timeline sidebar ── */}
          <div className="lg:w-56 shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Timeline</p>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-1">
                {versions.map((v, i) => {
                  const feats = v.features ? v.features.split('\n').filter(Boolean) : [];
                  const isActive = selectedIdx === i;
                  const isLast = i === versions.length - 1;
                  return (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedIdx(i); setEditingFeatures(false); }}
                      className={`w-full flex items-start gap-3 px-2 py-2 rounded-lg text-left transition-all relative z-10 ${isActive ? 'bg-primary/10' : 'hover:bg-muted/60'}`}
                    >
                      <div className={`mt-1 w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors ${isActive ? 'bg-primary border-primary' : isLast ? 'bg-card border-primary/50' : 'bg-card border-border'}`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold font-mono truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{v.label}</p>
                        <p className="text-[10px] text-muted-foreground">{feats.length} feature{feats.length !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Version detail panel ── */}
          {selectedVersion && (
            <div className="flex-1 min-w-0">
              <motion.div
                key={selectedVersion.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                {/* Version header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <Badge className="font-mono text-sm bg-primary/10 text-primary border-primary/20 px-3 py-1">
                      {editingFeatures ? (
                        <input
                          value={localLabel}
                          onChange={e => setLocalLabel(e.target.value)}
                          className="bg-transparent font-mono text-sm outline-none w-24"
                        />
                      ) : selectedVersion.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(selectedVersion.created_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Prev/Next navigation */}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={selectedIdx === 0} onClick={() => { setSelectedIdx(i => i - 1); setEditingFeatures(false); }}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={selectedIdx === versions.length - 1} onClick={() => { setSelectedIdx(i => i + 1); setEditingFeatures(false); }}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    {!editingFeatures ? (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" onClick={startEdit}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(selectedVersion.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending} className="h-7 gap-1 text-xs bg-primary hover:bg-primary/90 px-3">
                          <Save className="w-3 h-3" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Features checklist */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Features · {displayFeatures.filter(f => f.startsWith('✓ ')).length}/{displayFeatures.length} done
                    </p>
                    {!editingFeatures && (
                      <button onClick={startEdit} className="text-xs text-primary hover:underline">Edit</button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <AnimatePresence>
                      {displayFeatures.length === 0 && (
                        <p className="text-sm text-muted-foreground/60 italic">No features yet.</p>
                      )}
                      {displayFeatures.map((f, i) => {
                        const done = f.startsWith('✓ ');
                        const label = done ? f.slice(2) : f;
                        return (
                          <motion.div
                            key={f + i}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 group transition-colors ${done ? 'bg-primary/5' : 'bg-muted/40'}`}
                          >
                            {/* Checkbox toggle — always clickable */}
                            <button
                              onClick={() => {
                                if (editingFeatures) {
                                  toggleFeature(f);
                                } else {
                                  // Quick toggle without full edit mode
                                  const updated = displayFeatures.map(feat =>
                                    feat === f ? (feat.startsWith('✓ ') ? feat.slice(2) : '✓ ' + feat) : feat
                                  );
                                  updateMutation.mutate({
                                    vid: selectedVersion.id,
                                    data: { features: updated.join('\n') },
                                  });
                                }
                              }}
                              className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}
                            >
                              {done && <Check className="w-2.5 h-2.5 text-white" />}
                            </button>
                            <span className={`text-sm flex-1 ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{label}</span>
                            {editingFeatures && (
                              <button onClick={() => removeFeature(f)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Add feature input — only when editing */}
                  {editingFeatures && (
                    <div className="flex gap-2 mt-3">
                      <Input
                        value={newFeatureText}
                        onChange={e => setNewFeatureText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addFeature()}
                        placeholder="Add a feature..."
                        className="h-8 text-sm flex-1"
                        autoFocus
                      />
                      <Button size="sm" variant="outline" onClick={addFeature} className="h-8 gap-1 text-xs shrink-0">
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes / summary */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Change Summary</p>
                  {editingFeatures ? (
                    <Textarea
                      value={localNotes}
                      onChange={e => setLocalNotes(e.target.value)}
                      placeholder="Why did you make these changes? What did you adjust?"
                      className="text-sm min-h-[80px] resize-none"
                    />
                  ) : selectedVersion.notes ? (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 leading-relaxed">
                      {selectedVersion.notes}
                    </p>
                  ) : (
                    <button
                      onClick={startEdit}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 border border-dashed border-border rounded-lg px-3 py-2 w-full text-left"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add a change summary...
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Prev / Next navigation footer */}
              <div className="flex items-center justify-between mt-4 px-1">
                <Button
                  size="sm" variant="ghost"
                  className="gap-1.5 text-xs text-muted-foreground"
                  disabled={selectedIdx === 0}
                  onClick={() => { setSelectedIdx(i => i - 1); setEditingFeatures(false); }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {versions[selectedIdx - 1]?.label || ''}
                </Button>
                <span className="text-xs text-muted-foreground">{selectedIdx + 1} / {versions.length}</span>
                <Button
                  size="sm" variant="ghost"
                  className="gap-1.5 text-xs text-muted-foreground"
                  disabled={selectedIdx === versions.length - 1}
                  onClick={() => { setSelectedIdx(i => i + 1); setEditingFeatures(false); }}
                >
                  {versions[selectedIdx + 1]?.label || ''}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
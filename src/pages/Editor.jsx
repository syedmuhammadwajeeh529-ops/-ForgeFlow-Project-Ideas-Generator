import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import CodeEditor from '@/components/editor/CodeEditor';
import VersionHistoryPanel from '@/components/editor/VersionHistoryPanel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Sparkles, FileText, History, GitBranch } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('in_progress');
  const [aiHint, setAiHint] = useState('');
  const [loadingHint, setLoadingHint] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.SavedProject.filter({ id }),
    select: (data) => data[0],
  });

  useEffect(() => {
    if (project) {
      setCode(project.code || '');
      setLanguage(project.language || 'javascript');
      setNotes(project.notes || '');
      setStatus(project.status || 'in_progress');
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedProject.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast({ title: 'Saved!', description: 'Your code has been saved.' });
    },
  });

  const handleSave = (newCode, newLang) => {
    updateMutation.mutate({
      code: newCode,
      language: newLang,
      notes,
      status,
    });
  };

  const handleCodeChange = (newCode, newLang) => {
    setCode(newCode);
    setLanguage(newLang);
  };

  const handleNewVersion = async () => {
    setSavingVersion(true);
    const count = await base44.entities.ProjectVersion.filter({ project_id: id });
    const label = `v${count.length + 1} - ${new Date().toLocaleString()}`;
    await base44.entities.ProjectVersion.create({ project_id: id, label, code, language, notes });
    toast({ title: 'Version saved!', description: label });
    setSavingVersion(false);
    queryClient.invalidateQueries({ queryKey: ['versions', id] });
  };

  const handleRestore = (version) => {
    setCode(version.code);
    setLanguage(version.language || language);
    setNotes(version.notes || notes);
    toast({ title: 'Version restored', description: version.label });
  };

  const getAiHint = async () => {
    if (!project) return;
    setLoadingHint(true);
    setAiHint('');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `I'm building: "${project.title}". ${project.description}. My current code (${language}):\n\n${code || '[no code yet]'}\n\nGive me a helpful, concise tip or next step to build this project. Be specific and practical. 2-3 sentences max.`,
    });
    setAiHint(result);
    setLoadingHint(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/saved')} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button size="sm" variant="outline" onClick={handleNewVersion} disabled={savingVersion} className="gap-1.5 h-8 text-xs">
          <GitBranch className="w-3.5 h-3.5" />
          {savingVersion ? 'Saving...' : 'New Version'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowVersions(v => !v)} className="gap-1.5 h-8 text-xs">
          <History className="w-3.5 h-3.5" />
          Version History
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{project.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {project.category && (
              <Badge variant="outline" className="text-xs text-primary border-primary/30">{project.category}</Badge>
            )}
            {project.difficulty && (
              <Badge variant="outline" className="text-xs">{project.difficulty}</Badge>
            )}
          </div>
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); updateMutation.mutate({ status: v, code, language, notes }); }}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {showVersions && (
        <div className="mb-4">
          <VersionHistoryPanel projectId={id} onRestore={handleRestore} onClose={() => setShowVersions(false)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code Editor - takes 2/3 */}
        <div className="lg:col-span-2" style={{ minHeight: '600px' }}>
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
            onSave={handleSave}
            isSaving={updateMutation.isPending}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Project Info */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">About</h3>
            <p className="text-sm text-foreground leading-relaxed">{project.description}</p>
            {project.tech_stack?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {project.tech_stack.map(t => (
                  <span key={t} className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* AI Hint */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Hint
              </h3>
              <Button size="sm" variant="outline" onClick={getAiHint} disabled={loadingHint} className="h-7 text-xs gap-1">
                {loadingHint ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Get hint
              </Button>
            </div>
            {aiHint ? (
              <p className="text-sm text-foreground leading-relaxed">{aiHint}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click "Get hint" for AI guidance on your project.</p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Notes
            </h3>
            <Textarea
              placeholder="Add notes, todos, ideas..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="text-sm min-h-[120px] resize-none border-border"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 text-xs w-full"
              onClick={() => updateMutation.mutate({ code, language, notes, status })}
              disabled={updateMutation.isPending}
            >
              Save Notes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
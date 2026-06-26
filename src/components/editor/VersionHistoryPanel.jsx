import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, X, History } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function VersionHistoryPanel({ projectId, onRestore, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => base44.entities.ProjectVersion.filter({ project_id: projectId }, '-created_date', 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectVersion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
      toast({ title: 'Version deleted' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, label }) => base44.entities.ProjectVersion.update(id, { label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
      setEditingId(null);
    },
  });

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-primary" /> Version History
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No versions saved yet. Click "New Version" to snapshot your current code.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-sm">
              {editingId === v.id ? (
                <input
                  className="flex-1 bg-muted rounded px-2 py-0.5 text-xs border border-border focus:outline-none"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  onBlur={() => updateMutation.mutate({ id: v.id, label: editLabel })}
                  onKeyDown={e => e.key === 'Enter' && updateMutation.mutate({ id: v.id, label: editLabel })}
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 font-mono text-xs cursor-pointer hover:text-primary"
                  onClick={() => { setEditingId(v.id); setEditLabel(v.label); }}
                  title="Click to rename"
                >
                  {v.label}
                </span>
              )}
              <Badge variant="outline" className="text-[10px] shrink-0">{v.language}</Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-xs gap-1 text-muted-foreground hover:text-primary"
                onClick={() => onRestore(v)}
              >
                <RotateCcw className="w-3 h-3" /> Restore
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate(v.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
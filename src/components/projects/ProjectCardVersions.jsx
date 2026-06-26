import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { GitBranch, CheckCircle2 } from 'lucide-react';

export default function ProjectCardVersions({ projectId }) {
  const { data: versions = [] } = useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => base44.entities.ProjectVersion.filter({ project_id: projectId }, '-created_date', 10),
  });

  if (versions.length === 0) {
    return <p className="text-xs text-muted-foreground/50 italic py-1">No versions yet.</p>;
  }

  const latest = versions[0];
  const features = latest.features ? latest.features.split('\n').filter(Boolean) : [];
  const doneCount = features.filter(f => f.startsWith('✓ ')).length;
  const totalCount = features.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;

  return (
    <div className="flex flex-col gap-2 bg-muted/30 rounded-lg px-3 py-2.5 border border-border/50">
      {/* Top row: version badge + count */}
      <div className="flex items-center justify-between">
        <Badge className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20 px-2 py-0.5 gap-1">
          <GitBranch className="w-2.5 h-2.5" />
          {latest.label}
        </Badge>
        <div className="flex items-center gap-1">
          {allDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          ) : null}
          <span className={`text-xs font-semibold ${allDone ? 'text-green-600' : 'text-foreground'}`}>
            {doneCount}/{totalCount}
          </span>
          <span className="text-[10px] text-muted-foreground">features</span>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 ? (
        <div className="space-y-1">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`text-[10px] font-medium ${allDone ? 'text-green-600' : 'text-muted-foreground'}`}>
            {allDone ? '✓ All features complete' : `${pct}% complete`}
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/60 italic">No features listed yet.</p>
      )}
    </div>
  );
}
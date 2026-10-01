import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, GitBranch, History, Sparkles } from 'lucide-react';
import { parseFeatureRecords } from '@/lib/version-plan';

const statusStyles = {
  active: 'text-primary',
  completed: 'text-green-600',
  locked: 'text-muted-foreground',
};

export default function ProjectCardVersions({ projectId }) {
  const navigate = useNavigate();
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['versions', String(projectId)],
    queryFn: async () => (await api.get(`/project-versions/${projectId}`)).data,
  });

  if (isLoading) return <p className="py-1 text-xs text-muted-foreground/60">Preparing Version 0.1…</p>;
  if (versions.length === 0) return <p className="py-1 text-xs italic text-muted-foreground/60">No version plan yet.</p>;

  const currentVersion = versions.find((version) => version.status === 'active')
    || versions.filter((version) => version.status === 'completed').at(-1)
    || versions[0];
  const features = parseFeatureRecords(currentVersion.features, currentVersion.feature_meta);
  const completedCount = features.filter((feature) => feature.completed).length;

  return (
    <section className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <GitBranch className="h-3.5 w-3.5 text-primary" /> Current version
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 px-2 text-[10px] text-muted-foreground hover:text-primary"
          onClick={() => navigate(`/versions/${projectId}?mode=view`)}
        >
          <History className="h-3 w-3" /> Version History
        </Button>
      </div>

      <div className="rounded-md border border-border/50 bg-card/70 px-2.5 py-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Badge className="border-primary/20 bg-primary/10 px-1.5 py-0 font-mono text-[10px] text-primary">
            {currentVersion.label}
          </Badge>
          <span className={`text-[10px] font-medium capitalize ${statusStyles[currentVersion.status] || statusStyles.locked}`}>
            {currentVersion.status} · {completedCount}/{features.length} built
          </span>
        </div>
        <ul className="space-y-1.5">
          {features.map((feature) => (
            <li key={feature.id} className={`flex items-start gap-1.5 text-[11px] leading-snug ${feature.completed ? 'text-muted-foreground line-through' : 'text-foreground/80'}`}>
              <CheckCircle2 className={`mt-0.5 h-3 w-3 shrink-0 ${feature.completed ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span className="flex-1">{feature.text}</span>
              {feature.source === 'ai' && <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-label="AI suggested" />}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

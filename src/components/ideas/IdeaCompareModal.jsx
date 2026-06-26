import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, CheckCircle2, X } from 'lucide-react';

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-700 border-green-200',
  Intermediate: 'bg-orange-100 text-orange-700 border-orange-200',
  Advanced: 'bg-red-100 text-red-700 border-red-200',
};

const categoryColors = {
  Web: 'bg-blue-100 text-blue-700',
  Mobile: 'bg-purple-100 text-purple-700',
  'AI/ML': 'bg-pink-100 text-pink-700',
  CLI: 'bg-cyan-100 text-cyan-700',
  Game: 'bg-yellow-100 text-yellow-700',
  API: 'bg-orange-100 text-orange-700',
  Data: 'bg-green-100 text-green-700',
  DevOps: 'bg-red-100 text-red-700',
  Other: 'bg-purple-100 text-purple-700',
};

function IdeaColumn({ idea, onSave, isSaving }) {
  if (!idea) return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl p-8 min-h-[300px]">
      Select an idea to compare
    </div>
  );

  const sharedTech = [];

  return (
    <div className="flex-1 border border-border rounded-xl p-5 space-y-4 bg-card">
      {/* Header */}
      <div className="space-y-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${categoryColors[idea.category] || 'bg-purple-100 text-purple-700'}`}>
          {idea.category?.slice(0, 2)}
        </div>
        <h3 className="font-bold text-base leading-snug">{idea.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className={`text-xs border ${difficultyColors[idea.difficulty]}`}>
          {idea.difficulty}
        </Badge>
        <Badge variant="outline" className={`text-xs ${categoryColors[idea.category] || 'bg-purple-100 text-purple-700'}`}>
          {idea.category}
        </Badge>
      </div>

      {/* Tech Stack */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tech Stack</p>
        <div className="flex flex-wrap gap-1.5">
          {(idea.tech_stack || []).map(tech => (
            <span key={tech} className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded-md">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Tags */}
      {idea.tags?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</p>
          <div className="flex flex-wrap gap-1">
            {idea.tags.map(tag => (
              <span key={tag} className="text-[11px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <Button
        size="sm"
        className="w-full gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground mt-auto"
        onClick={() => onSave(idea)}
        disabled={isSaving}
      >
        <BookmarkPlus className="w-3.5 h-3.5" />
        Save Project
      </Button>
    </div>
  );
}

export default function IdeaCompareModal({ open, onClose, ideas, onSave, isSaving }) {
  const [a, b] = ideas;

  // Find shared tech
  const techA = new Set(a?.tech_stack || []);
  const techB = new Set(b?.tech_stack || []);
  const shared = [...techA].filter(t => techB.has(t));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Compare Ideas</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mt-2">
          <IdeaColumn idea={a} onSave={onSave} isSaving={isSaving} />
          <IdeaColumn idea={b} onSave={onSave} isSaving={isSaving} />
        </div>

        {shared.length > 0 && (
          <div className="mt-4 bg-accent/40 border border-primary/10 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Shared Technologies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {shared.map(tech => (
                <span key={tech} className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
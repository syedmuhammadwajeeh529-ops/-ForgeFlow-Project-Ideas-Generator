import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Eye } from 'lucide-react';
import IdeaPreviewModal from './IdeaPreviewModal';

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-700 border-green-200',
  Intermediate: 'bg-orange-100 text-orange-700 border-orange-200',
  Advanced: 'bg-red-100 text-red-700 border-red-200',
};

export default function IdeaDetailModal({ idea, open, onClose, onSave, isSaving }) {
  const [showPreview, setShowPreview] = useState(false);

  if (!idea) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold pr-8">{idea.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={`border ${difficultyColors[idea.difficulty]}`}>
                {idea.difficulty}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary/30">
                {idea.category}
              </Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed text-sm">
              {idea.description}
            </p>

            {idea.tech_stack?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Tech Stack
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {idea.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {idea.tags?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {idea.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  onSave(idea);
                  onClose();
                }}
                disabled={isSaving}
                className="gap-2"
              >
                <BookmarkPlus className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showPreview && (
        <IdeaPreviewModal
          idea={idea}
          open={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
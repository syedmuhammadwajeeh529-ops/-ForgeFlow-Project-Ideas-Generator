import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookmarkPlus,
  Zap,
  Eye,
  GitBranch
} from "lucide-react";

import IdeaPreviewModal from "./IdeaPreviewModal";
import { getInitialVersionPlan } from '@/lib/version-plan';

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

export default function IdeaCard({ idea, onSave, onOpen, index = 0, isSaving = false }) {
  const [showPreview, setShowPreview] = useState(false);
  const currentVersion = getInitialVersionPlan(idea.category)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 w-full"
    >
      {/* Top row: title + badges + curated */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${categoryColors[idea.category] || 'bg-purple-100 text-purple-700'}`}>
          {idea.category?.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className="font-semibold text-sm text-foreground leading-snug group-hover:text-primary transition-colors cursor-pointer"
              onClick={() => onOpen(idea)}
            >
              {idea.title}
            </h3>
            {idea.is_curated && (
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold px-1.5 py-0.5">
                <Zap className="w-2.5 h-2.5 mr-1" /> Curated
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs border ${difficultyColors[idea.difficulty]}`}>
              {idea.difficulty}
            </Badge>
            <Badge variant="outline" className={`text-xs ${categoryColors[idea.category] || 'bg-purple-100 text-purple-700'}`}>
              {idea.category}
            </Badge>
            {idea.tech_stack?.slice(0, 3).map((tech) => (
              <span key={tech} className="text-[11px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                {tech}
              </span>
            ))}
            {idea.tech_stack?.length > 3 && (
              <span className="text-[11px] text-muted-foreground">+{idea.tech_stack.length - 3}</span>
            )}
          </div>
        </div>
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          onClick={(event) => { event.stopPropagation(); onSave(idea); }}
          disabled={isSaving}
          title="Save project"
          aria-label={`Save ${idea.title}`}
        >
          <BookmarkPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{idea.description}</p>

      <div className="mb-3 rounded-lg border border-primary/10 bg-accent/40 px-3 py-2.5">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          <GitBranch className="h-3 w-3" /> Version plan
        </p>
        <div className="rounded-md border border-border/60 bg-card/70 px-2.5 py-2">
          <p className="font-mono text-[11px] font-semibold text-primary">{currentVersion.label} · {currentVersion.summary}</p>
          <div className="mt-1.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {currentVersion.features.map((feature) => (
              <p key={feature} className="flex gap-1 text-[11px] leading-snug text-foreground/80">
                <span className="text-primary">✦</span>{feature}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="ghost"
          className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-purple-600 hover:bg-purple-50"
          onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </Button>
        
      </div>

      {showPreview && (
        <IdeaPreviewModal idea={idea} open={showPreview} onClose={() => setShowPreview(false)} />
      )}
    </motion.div>
  );
}

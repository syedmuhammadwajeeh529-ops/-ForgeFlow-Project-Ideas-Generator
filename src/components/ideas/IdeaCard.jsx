import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Zap, Eye, GitBranch, Pencil, ChevronDown, ChevronUp, CheckCircle2, GitCompareArrows } from 'lucide-react';
import IdeaPreviewModal from './IdeaPreviewModal';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

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

// Predefined planned features per category/idea type
function getPlannedFeatures(idea) {
  const byCategory = {
    Web: ['User authentication & profiles', 'Responsive UI with Tailwind CSS', 'REST API integration', 'Data persistence with a database', 'Deployment to Vercel/Netlify'],
    Mobile: ['Cross-platform iOS & Android support', 'Push notifications', 'Offline mode with local storage', 'User auth with social login', 'App store deployment'],
    'AI/ML': ['LLM API integration (OpenAI/Gemini)', 'Prompt engineering & tuning', 'Structured JSON output parsing', 'Loading states & streaming', 'Result history & caching'],
    CLI: ['Argument parsing & help text', 'Config file support', 'Colorized terminal output', 'Error handling & exit codes', 'npm package publishing'],
    Game: ['Game loop & state machine', 'Keyboard/touch controls', 'Score tracking & leaderboard', 'Multiple levels or modes', 'Sound effects & animations'],
    API: ['RESTful endpoint design', 'Request validation & error handling', 'API key auth & rate limiting', 'Auto-generated docs (Swagger)', 'Deployment & CI/CD'],
    Data: ['File upload & parsing (CSV/JSON)', 'Interactive charts with Recharts', 'Filtering, sorting & search', 'Export to CSV/PDF', 'Summary statistics'],
    DevOps: ['Automated monitoring & alerts', 'CLI tooling & scripts', 'Docker containerization', 'CI/CD pipeline integration', 'Logging & observability'],
    Other: ['Core feature implementation', 'User-friendly UI', 'Data persistence', 'Error handling', 'Documentation'],
  };
  return byCategory[idea.category] || byCategory.Other;
}

function VersionHistoryInline({ savedProjectId }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['versions', savedProjectId],
    queryFn: () => base44.entities.ProjectVersion.filter({ project_id: savedProjectId }, '-created_date', 20),
    enabled: !!savedProjectId,
  });

  if (isLoading) return <p className="text-xs text-muted-foreground py-2">Loading versions...</p>;
  if (versions.length === 0) return <p className="text-xs text-muted-foreground/60 italic py-2">No versions saved yet. Open the editor to start coding and save versions.</p>;

  return (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
      {versions.map((v) => {
        const features = v.features ? v.features.split('\n').filter(Boolean) : [];
        return (
          <div key={v.id} className="bg-muted/50 rounded-lg px-3 py-2 border border-border/60">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20 px-1.5 py-0">{v.label}</Badge>
              <span className="text-[10px] text-muted-foreground">{new Date(v.created_date).toLocaleDateString()}</span>
            </div>
            {features.length > 0 ? (
              <ul className="space-y-0.5">
                {features.map((f, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">No features listed.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function IdeaCard({ idea, onSave, onOpen, index = 0, isSaving = false, savedProjectId = null, isComparing = false, compareDisabled = false, onToggleCompare }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const navigate = useNavigate();
  const plannedFeatures = getPlannedFeatures(idea);

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
          <div className="flex items-center gap-1.5 flex-wrap">
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
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{idea.description}</p>

      {/* Planned Features */}
      <div className="bg-accent/40 rounded-lg px-3 py-2.5 mb-3 border border-primary/10">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">What you'll build</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          {plannedFeatures.map((f, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
              <span className="text-primary shrink-0 mt-0.5">✦</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Version History (inline toggle) */}
      {savedProjectId && (
        <AnimatePresence>
          {showVersions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="border border-border rounded-lg p-3 bg-muted/20">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3 text-primary" /> Version History
                </p>
                <VersionHistoryInline savedProjectId={savedProjectId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          className="gap-1.5 h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={(e) => { e.stopPropagation(); onSave(idea); }}
          disabled={isSaving}
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          Save Project
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-purple-600 hover:bg-purple-50"
          onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </Button>
        {onToggleCompare && (
          <Button
            size="sm"
            variant="ghost"
            className={`text-xs gap-1.5 h-7 transition-colors ${isComparing ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
            onClick={(e) => { e.stopPropagation(); onToggleCompare(idea); }}
            disabled={compareDisabled}
            title={compareDisabled ? 'Max 2 ideas for comparison' : isComparing ? 'Remove from compare' : 'Add to compare'}
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            {isComparing ? 'Comparing' : 'Compare'}
          </Button>
        )}
        {savedProjectId && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={(e) => { e.stopPropagation(); setShowVersions(v => !v); }}
            >
              <GitBranch className="w-3.5 h-3.5" />
              {showVersions ? 'Hide' : 'Versions'}
              {showVersions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
              onClick={(e) => { e.stopPropagation(); navigate(`/versions/${savedProjectId}`); }}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Versions
            </Button>
          </>
        )}
      </div>

      {showPreview && (
        <IdeaPreviewModal idea={idea} open={showPreview} onClose={() => setShowPreview(false)} />
      )}
    </motion.div>
  );
}
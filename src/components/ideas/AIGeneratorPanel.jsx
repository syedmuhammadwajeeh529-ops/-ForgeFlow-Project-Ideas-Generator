import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, BookmarkPlus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['Web', 'Mobile', 'AI/ML', 'CLI', 'Game', 'API', 'Data', 'DevOps'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function AIGeneratorPanel({ onSave }) {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState(null);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    setIdea(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a unique and creative coding project idea${category ? ` in the ${category} category` : ''}${difficulty ? ` for a ${difficulty} developer` : ''}. Be specific and practical. Return a JSON object.`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
          category: { type: 'string', enum: ['Web', 'Mobile', 'AI/ML', 'CLI', 'Game', 'API', 'Data', 'DevOps', 'Other'] },
          tech_stack: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    setIdea(result);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!idea) return;
    setSaving(true);
    await onSave({ ...idea, idea_id: 'ai-generated' });
    setSaving(false);
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 via-accent to-background border border-primary/20 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-lg">AI Idea Generator</h2>
          <p className="text-sm text-muted-foreground">Get a unique project idea instantly</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40 h-9 bg-background border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any category</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-40 h-9 bg-background border-border">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any level</SelectItem>
            {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button onClick={generate} disabled={loading} className="gap-2 h-9 bg-primary hover:bg-primary/90 shadow-md shadow-primary/25">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Generating...' : 'Generate Idea'}
        </Button>
      </div>

      <AnimatePresence>
        {idea && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-xl p-4 mt-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1">{idea.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{idea.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{idea.difficulty}</Badge>
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">{idea.category}</Badge>
                </div>
                {idea.tech_stack?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {idea.tech_stack.map(t => (
                      <span key={t} className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90">
                <BookmarkPlus className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Project'}
              </Button>
              <Button size="sm" variant="outline" onClick={generate} disabled={loading} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
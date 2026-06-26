import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Eye, Monitor } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Module-level cache so previews persist across modal open/close
const previewCache = {};

export default function IdeaPreviewModal({ idea, open, onClose }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [screenImages, setScreenImages] = useState({}); // { screenIndex: url }
  const [activeScreen, setActiveScreen] = useState(0);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (!open || !idea) return;
    const cacheKey = idea.id || idea.title;
    if (previewCache[cacheKey]) {
      setPreview(previewCache[cacheKey].preview);
      setScreenImages(previewCache[cacheKey].images);
      setActiveScreen(0);
      return;
    }
    if (generatingRef.current) return;
    generatePreview();
  }, [open, idea]);

  const generatePreview = async () => {
    if (!idea) return;
    generatingRef.current = true;
    setLoading(true);
    setPreview(null);
    setScreenImages({});
    setActiveScreen(0);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a UI/UX expert. Given this project idea, describe what the finished app would look like in detail:

Title: ${idea.title}
Description: ${idea.description}
Category: ${idea.category}
Tech Stack: ${idea.tech_stack?.join(', ')}

Return a JSON with:
- tagline: a one-line catchy description of the finished product
- screens: array of 3-4 key screens/pages the app would have, each with { name, description, key_elements: [] }
- design_style: describe the visual design (colors, layout style, feel)
- standout_features: array of 3 standout UI features`,
      response_json_schema: {
        type: 'object',
        properties: {
          tagline: { type: 'string' },
          screens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                key_elements: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          design_style: { type: 'string' },
          standout_features: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    setPreview(result);
    setLoading(false);

    // Generate images for each screen in parallel
    const screens = result.screens || [];
    const imagePromises = screens.map((screen, i) =>
      base44.integrations.Core.GenerateImage({
        prompt: `A clean, modern UI mockup screenshot of the "${screen.name}" screen for a ${idea.category} app called "${idea.title}". ${result.design_style}. This screen: ${screen.description}. Key UI elements: ${screen.key_elements?.join(', ')}. Professional app design, light theme, high detail, realistic interface.`,
      }).then(img => ({ i, url: img.url }))
    );

    // Update images as each one comes in
    for (const promise of imagePromises) {
      promise.then(({ i, url }) => {
        setScreenImages(prev => {
          const updated = { ...prev, [i]: url };
          // Update cache as images arrive
          const cacheKey = idea.id || idea.title;
          if (previewCache[cacheKey]) {
            previewCache[cacheKey].images = updated;
          }
          return updated;
        });
      });
    }

    // Store in cache
    const cacheKey = idea.id || idea.title;
    previewCache[cacheKey] = { preview: result, images: {} };
    generatingRef.current = false;
  };

  const screens = preview?.screens || [];
  const currentScreen = screens[activeScreen];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Eye className="w-5 h-5 text-primary" /> Preview: {idea?.title}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating your app preview...</p>
          </div>
        ) : preview ? (
          <div className="space-y-5">
            {/* Tagline */}
            <div className="bg-gradient-to-r from-primary/10 to-accent rounded-xl p-4">
              <p className="text-base font-medium text-foreground italic">"{preview.tagline}"</p>
            </div>

            {/* Screen navigator */}
            {screens.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" /> Screens
                    <span className="ml-1 text-muted-foreground/60 normal-case">({activeScreen + 1}/{screens.length})</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 w-7 p-0"
                      disabled={activeScreen === 0}
                      onClick={() => setActiveScreen(i => i - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 w-7 p-0"
                      disabled={activeScreen === screens.length - 1}
                      onClick={() => setActiveScreen(i => i + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Screen tab pills */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {screens.map((screen, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreen(i)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                        activeScreen === i
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {screen.name}
                    </button>
                  ))}
                </div>

                {/* Active screen mockup image */}
                <div className="rounded-xl overflow-hidden border border-border bg-muted min-h-[220px] flex items-center justify-center mb-3">
                  {screenImages[activeScreen] ? (
                    <img src={screenImages[activeScreen]} alt={currentScreen?.name} className="w-full h-auto rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Generating mockup for "{currentScreen?.name}"...</p>
                    </div>
                  )}
                </div>

                {/* Active screen details */}
                {currentScreen && (
                  <div className="bg-card border border-border rounded-lg p-3">
                    <p className="font-semibold text-sm mb-1">{currentScreen.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{currentScreen.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {currentScreen.key_elements?.map((el, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">{el}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Design Style */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Design Style</p>
              <p className="text-sm text-foreground leading-relaxed">{preview.design_style}</p>
            </div>

            {/* Standout Features */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Standout UI Features</p>
              <ul className="space-y-1">
                {preview.standout_features?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
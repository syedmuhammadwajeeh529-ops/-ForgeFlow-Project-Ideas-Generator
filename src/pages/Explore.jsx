import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import IdeaCard from '@/components/ideas/IdeaCard';
import AIGeneratorPanel from '@/components/ideas/AIGeneratorPanel';
import FiltersBar from '@/components/ideas/FiltersBar';
import IdeaDetailModal from '@/components/ideas/IdeaDetailModal';
import IdeaCompareModal from '@/components/ideas/IdeaCompareModal';
import { Button } from '@/components/ui/button';
import { Loader2, Shuffle, Mic, MicOff, GitCompareArrows, X } from 'lucide-react';

const SOFTWARE_IDEAS = [
  // Web
  { id: 's1', title: 'Invoice Generator', category: 'Web', difficulty: 'Beginner', description: 'A web-based tool for freelancers to create, send, and track invoices with PDF export.', tech_stack: ['React', 'Node.js', 'Stripe'], is_curated: true, tags: ['Finance', 'Freelance', 'PDF'] },
  { id: 's2', title: 'Personal Dashboard', category: 'Web', difficulty: 'Intermediate', description: 'A customizable browser start page with widgets for weather, tasks, bookmarks, and news.', tech_stack: ['React', 'Tailwind CSS', 'REST APIs'], is_curated: true, tags: ['Productivity', 'Dashboard'] },
  { id: 's3', title: 'Recipe Sharing Platform', category: 'Web', difficulty: 'Intermediate', description: 'A community website where users can post, rate, and comment on recipes with ingredient search.', tech_stack: ['React', 'Node.js', 'MongoDB'], is_curated: false, tags: ['Food', 'Community', 'Search'] },
  { id: 's4', title: 'Job Board', category: 'Web', difficulty: 'Intermediate', description: 'A niche job listing site where employers post and developers apply, with email notifications.', tech_stack: ['Next.js', 'PostgreSQL', 'Resend'], is_curated: true, tags: ['Jobs', 'SaaS'] },
  { id: 's5', title: 'URL Shortener', category: 'Web', difficulty: 'Beginner', description: 'A web service that creates short links with click analytics and custom slugs.', tech_stack: ['Node.js', 'Redis', 'React'], is_curated: false, tags: ['Utility', 'Analytics'] },
  { id: 's6', title: 'Portfolio Builder', category: 'Web', difficulty: 'Beginner', description: 'A drag-and-drop tool for developers to create and publish a personal portfolio site.', tech_stack: ['React', 'Firebase', 'Tailwind CSS'], is_curated: true, tags: ['Portfolio', 'Builder'] },
  { id: 's7', title: 'Event Ticketing App', category: 'Web', difficulty: 'Advanced', description: 'A web platform to create events, sell tickets, and manage attendees with QR code check-in.', tech_stack: ['Next.js', 'Stripe', 'QRCode'], is_curated: false, tags: ['Events', 'Payments'] },
  { id: 's8', title: 'Bookmark Manager', category: 'Web', difficulty: 'Beginner', description: 'A web app to save, tag, and search bookmarks with browser extension sync.', tech_stack: ['React', 'SQLite', 'Chrome Extension API'], is_curated: false, tags: ['Productivity', 'Bookmarks'] },
  // Mobile
  { id: 'm1', title: 'Habit Tracker App', category: 'Mobile', difficulty: 'Beginner', description: 'A mobile app to build and track daily habits with streaks, reminders, and progress charts.', tech_stack: ['React Native', 'AsyncStorage', 'Expo'], is_curated: true, tags: ['Health', 'Productivity'] },
  { id: 'm2', title: 'Expense Splitter', category: 'Mobile', difficulty: 'Intermediate', description: 'A mobile app to split bills among friends, track debts, and settle up with payment links.', tech_stack: ['React Native', 'Firebase', 'Stripe'], is_curated: true, tags: ['Finance', 'Social'] },
  { id: 'm3', title: 'Local Events Finder', category: 'Mobile', difficulty: 'Intermediate', description: 'A location-based mobile app to discover nearby events, concerts, and meetups.', tech_stack: ['React Native', 'Google Maps API', 'Expo'], is_curated: false, tags: ['Events', 'Location'] },
  { id: 'm4', title: 'Flashcard Study App', category: 'Mobile', difficulty: 'Beginner', description: 'A mobile flashcard app with spaced repetition algorithm to help users memorize anything.', tech_stack: ['React Native', 'SQLite', 'Expo'], is_curated: true, tags: ['Education', 'Learning'] },
  { id: 'm5', title: 'Sleep Tracker', category: 'Mobile', difficulty: 'Intermediate', description: 'A mobile app that logs sleep duration and quality with graphs and smart alarm suggestions.', tech_stack: ['React Native', 'HealthKit', 'Expo'], is_curated: false, tags: ['Health', 'Sleep'] },
  { id: 'm6', title: 'Plant Care Reminder', category: 'Mobile', difficulty: 'Beginner', description: 'A mobile app to track houseplants, set watering reminders, and log plant health.', tech_stack: ['React Native', 'Notifications API', 'Expo'], is_curated: true, tags: ['Lifestyle', 'Reminders'] },
  { id: 'm7', title: 'Workout Logger', category: 'Mobile', difficulty: 'Intermediate', description: 'A gym tracking app where users log sets, reps, and weights with progress visualization.', tech_stack: ['React Native', 'SQLite', 'Recharts'], is_curated: false, tags: ['Fitness', 'Tracker'] },
  { id: 'm8', title: 'Language Phrase Book', category: 'Mobile', difficulty: 'Beginner', description: 'A travel companion app with offline phrase packs for common languages and pronunciation audio.', tech_stack: ['React Native', 'Expo', 'AsyncStorage'], is_curated: false, tags: ['Travel', 'Language'] },
  // AI/ML
  { id: 'a1', title: 'AI Code Review Bot', category: 'AI/ML', difficulty: 'Intermediate', description: 'A tool that automatically reviews pull requests and suggests improvements using AI.', tech_stack: ['Node.js', 'OpenAI API', 'GitHub API'], is_curated: true, tags: ['AI', 'DevOps', 'Productivity'] },
  { id: 'a2', title: 'Resume Analyzer', category: 'AI/ML', difficulty: 'Beginner', description: 'Upload a resume and get AI-powered feedback, keyword suggestions, and job match scores.', tech_stack: ['Python', 'OpenAI API', 'FastAPI'], is_curated: true, tags: ['AI', 'Career'] },
  { id: 'a3', title: 'AI Meal Planner', category: 'AI/ML', difficulty: 'Intermediate', description: 'An app that generates personalized weekly meal plans based on dietary preferences and goals.', tech_stack: ['Python', 'OpenAI API', 'React'], is_curated: false, tags: ['AI', 'Health', 'Food'] },
  { id: 'a4', title: 'Sentiment Dashboard', category: 'AI/ML', difficulty: 'Intermediate', description: 'Analyze customer reviews or social media posts and visualize sentiment trends over time.', tech_stack: ['Python', 'HuggingFace', 'Recharts'], is_curated: true, tags: ['NLP', 'Analytics'] },
  { id: 'a5', title: 'AI Writing Assistant', category: 'AI/ML', difficulty: 'Beginner', description: 'A writing tool that helps rephrase, expand, or summarize text using a language model.', tech_stack: ['React', 'OpenAI API', 'Node.js'], is_curated: false, tags: ['AI', 'Writing'] },
  { id: 'a6', title: 'Image Caption Generator', category: 'AI/ML', difficulty: 'Intermediate', description: 'Upload an image and get AI-generated captions or alt-text descriptions automatically.', tech_stack: ['Python', 'CLIP', 'FastAPI'], is_curated: true, tags: ['Vision', 'AI'] },
  // CLI
  { id: 'c1', title: 'Project Scaffolding CLI', category: 'CLI', difficulty: 'Intermediate', description: 'A CLI tool to bootstrap new projects with templates for different stacks (React, Node, Python, etc.).', tech_stack: ['Node.js', 'Commander.js', 'Handlebars'], is_curated: false, tags: ['CLI', 'Templates', 'DevX'] },
  { id: 'c2', title: 'Env Variable Manager', category: 'CLI', difficulty: 'Intermediate', description: 'A CLI tool to manage, encrypt, and sync .env files across projects and team members securely.', tech_stack: ['Node.js', 'AES Encryption', 'Commander.js'], is_curated: true, tags: ['Security', 'DevOps', 'CLI'] },
  { id: 'c3', title: 'File Rename Automator', category: 'CLI', difficulty: 'Beginner', description: 'A CLI app that bulk renames files based on rules like date, regex, or metadata.', tech_stack: ['Python', 'argparse'], is_curated: false, tags: ['Files', 'Automation', 'Utility'] },
  { id: 'c4', title: 'Git Commit Wizard', category: 'CLI', difficulty: 'Beginner', description: 'An interactive CLI that guides you to write structured, conventional commit messages.', tech_stack: ['Node.js', 'Inquirer.js'], is_curated: true, tags: ['Git', 'DX'] },
  // Game
  { id: 'g1', title: 'Browser Puzzle Game', category: 'Game', difficulty: 'Intermediate', description: 'A sliding puzzle or Sudoku game playable in the browser with timer and leaderboard.', tech_stack: ['React', 'Canvas API'], is_curated: true, tags: ['Puzzle', 'Browser'] },
  { id: 'g2', title: '2D Platformer', category: 'Game', difficulty: 'Advanced', description: 'A side-scrolling platformer game with levels, enemies, and collectibles built with a game engine.', tech_stack: ['Phaser.js', 'JavaScript'], is_curated: false, tags: ['Game', '2D'] },
  { id: 'g3', title: 'Trivia Quiz App', category: 'Game', difficulty: 'Beginner', description: 'A multiplayer trivia game with timed rounds, categories, and score tracking.', tech_stack: ['React', 'Socket.io', 'Node.js'], is_curated: true, tags: ['Trivia', 'Multiplayer'] },
  { id: 'g4', title: 'Word Scramble Game', category: 'Game', difficulty: 'Beginner', description: 'A word game where players unscramble letters to form words before the timer runs out.', tech_stack: ['React', 'JavaScript'], is_curated: false, tags: ['Word', 'Casual'] },
  // API
  { id: 'ap1', title: 'API Mock Server', category: 'API', difficulty: 'Intermediate', description: 'A tool to quickly spin up mock REST or GraphQL APIs from a JSON config for frontend development.', tech_stack: ['Node.js', 'Express', 'GraphQL'], is_curated: true, tags: ['API', 'Testing', 'Backend'] },
  { id: 'ap2', title: 'Webhook Tester', category: 'API', difficulty: 'Beginner', description: 'A local tool to receive, inspect, and replay webhook payloads during development.', tech_stack: ['Node.js', 'ngrok', 'React'], is_curated: false, tags: ['Webhooks', 'Testing', 'API'] },
  { id: 'ap3', title: 'Public API Aggregator', category: 'API', difficulty: 'Intermediate', description: 'A service that aggregates data from multiple public APIs (weather, crypto, news) into one unified endpoint.', tech_stack: ['Node.js', 'Express', 'Redis'], is_curated: true, tags: ['API', 'Data', 'Backend'] },
  { id: 'ap4', title: 'GraphQL Schema Explorer', category: 'API', difficulty: 'Advanced', description: 'A visual tool to explore, document, and test GraphQL schemas interactively.', tech_stack: ['React', 'GraphQL', 'Apollo'], is_curated: false, tags: ['GraphQL', 'DX'] },
  // Data
  { id: 'd1', title: 'CSV Data Explorer', category: 'Data', difficulty: 'Beginner', description: 'Upload a CSV file and instantly get charts, summaries, and filtering tools for your data.', tech_stack: ['Python', 'Pandas', 'Streamlit'], is_curated: true, tags: ['Data', 'Visualization'] },
  { id: 'd2', title: 'Stock Portfolio Tracker', category: 'Data', difficulty: 'Intermediate', description: 'Track stock holdings, visualize portfolio performance, and get alerts on price changes.', tech_stack: ['React', 'Alpha Vantage API', 'Recharts'], is_curated: true, tags: ['Finance', 'Data'] },
  { id: 'd3', title: 'Website Analytics Dashboard', category: 'Data', difficulty: 'Intermediate', description: 'A self-hosted analytics tool to track page views, events, and user journeys without cookies.', tech_stack: ['Node.js', 'ClickHouse', 'React'], is_curated: false, tags: ['Analytics', 'Privacy'] },
  { id: 'd4', title: 'Log Visualizer', category: 'Data', difficulty: 'Intermediate', description: 'Parse and visualize application logs to spot errors, trends, and anomalies with charts.', tech_stack: ['Python', 'Pandas', 'Plotly'], is_curated: false, tags: ['Logs', 'DevOps'] },
  // DevOps
  { id: 'dv1', title: 'Uptime Monitor', category: 'DevOps', difficulty: 'Intermediate', description: 'A service that pings your websites and APIs on a schedule and alerts you when they go down.', tech_stack: ['Node.js', 'Cron', 'Twilio'], is_curated: true, tags: ['Monitoring', 'Alerts'] },
  { id: 'dv2', title: 'Docker Compose Generator', category: 'DevOps', difficulty: 'Intermediate', description: 'A web UI to visually build and export docker-compose.yml files for common stacks.', tech_stack: ['React', 'Node.js'], is_curated: false, tags: ['Docker', 'DevX'] },
  { id: 'dv3', title: 'CI/CD Pipeline Visualizer', category: 'DevOps', difficulty: 'Advanced', description: 'A dashboard that visualizes GitHub Actions or GitLab CI pipeline runs with timing and error details.', tech_stack: ['React', 'GitHub API', 'D3.js'], is_curated: true, tags: ['CI/CD', 'GitHub'] },
  { id: 'dv4', title: 'Secret Rotation Tool', category: 'DevOps', difficulty: 'Advanced', description: 'A CLI/dashboard to manage and auto-rotate API keys and secrets across services securely.', tech_stack: ['Node.js', 'Vault', 'AWS Secrets Manager'], is_curated: false, tags: ['Security', 'Secrets'] },
];

export default function Explore() {
  const [search, setSearch] = useState('');
  const [displayedIdeas, setDisplayedIdeas] = useState(null);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [compareIdeas, setCompareIdeas] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [seed, setSeed] = useState(() => Math.random());
  const [plannerText, setPlannerText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiIdeas, setAiIdeas] = useState(null);
  const debounceRef = useRef(null);
  const micRef = useRef(null);
  const [micListening, setMicListening] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const category = new URLSearchParams(location.search).get('category') || 'All';

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ['project-ideas'],
    queryFn: () => base44.entities.ProjectIdea.list('-created_date', 100),
  });

  const { data: savedProjects = [] } = useQuery({
    queryKey: ['saved-projects'],
    queryFn: () => base44.entities.SavedProject.list('-updated_date', 100),
  });

  const saveProjectMutation = useMutation({
    mutationFn: async (idea) => {
      const saved = await base44.entities.SavedProject.create({
        idea_id: idea.id || 'ai-generated',
        title: idea.title,
        description: idea.description,
        difficulty: idea.difficulty,
        category: idea.category,
        tech_stack: idea.tech_stack || [],
        code: '',
        language: 'javascript',
        status: 'saved',
      });
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-projects'] });
      toast({ title: 'Project saved!', description: 'Find it in My Projects.' });
    },
  });

  const allIdeas = [...ideas, ...SOFTWARE_IDEAS];

  const getRandomFive = (pool) => {
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  };

  const defaultIdeas = useCallback(() => {
    const categoryPool = allIdeas.filter(idea => category === 'All' || idea.category === category);
    return getRandomFive(categoryPool);
  }, [ideas.length, seed, category])();

  const extractDifficulty = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('beginner') || lower.includes('easy') || lower.includes('simple')) return 'Beginner';
    if (lower.includes('intermediate') || lower.includes('medium')) return 'Intermediate';
    if (lower.includes('advanced') || lower.includes('hard') || lower.includes('expert')) return 'Advanced';
    return null;
  };

  const handleSearch = () => {
    const difficulty = extractDifficulty(search);
    const pool = allIdeas.filter(idea => {
      const matchCategory = category === 'All' || idea.category === category;
      const matchDifficulty = !difficulty || idea.difficulty === difficulty;
      const cleanSearch = search.replace(/projects?\s+for\s+/i, '').replace(/beginner|intermediate|advanced|easy|medium|hard|simple|expert/gi, '').trim();
      const matchSearch = !cleanSearch || idea.title?.toLowerCase().includes(cleanSearch.toLowerCase()) || idea.description?.toLowerCase().includes(cleanSearch.toLowerCase());
      return matchCategory && matchDifficulty && matchSearch;
    });
    setDisplayedIdeas(getRandomFive(pool));
  };

  const filteredIdeas = aiIdeas ?? displayedIdeas ?? defaultIdeas;

  const generateAiIdeas = async (text) => {
    if (!text.trim()) { setAiIdeas(null); return; }
    setAiGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate exactly 5 distinct project idea variations based on this concept: "${text}".
Each variation should be a specific, concrete take on the concept — like different implementations, board sizes, modes, mechanics, or scopes. For example, if the input is "tic tac toe game", generate variations like: 3x3 classic, 4x4 extended, 5x5 strategy, AI opponent, multiplayer online, etc.
If it's "todo app", generate: minimalist CLI todo, drag-and-drop web todo, team collaborative todo, voice-input todo, gamified todo with streaks.
Always stay true to the exact concept typed — do NOT change it to a different domain or category.
Return JSON array of 5 objects.`,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
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
          },
        },
      },
    });
    const ideas = (result.ideas || []).map((idea, i) => ({ ...idea, id: `ai-planner-${i}-${Date.now()}`, is_curated: false }));
    setAiIdeas(ideas);
    setAiGenerating(false);
  };

  const togglePlannerMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported in your browser. Try Chrome.'); return; }
    if (micListening) { micRef.current?.stop(); setMicListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    micRef.current = recognition;
    recognition.onstart = () => setMicListening(true);
    recognition.onend = () => setMicListening(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
      setPlannerText(transcript);
      if (event.results[0].isFinal) {
        setAiIdeas(null);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => generateAiIdeas(transcript), 100);
      }
    };
    recognition.start();
  };

  const handleSaveAndReturn = async (idea) => {
    const saved = await saveProjectMutation.mutateAsync(idea);
    return saved;
  };

  const toggleCompare = (idea) => {
    setCompareIdeas(prev => {
      if (prev.find(i => i.id === idea.id)) return prev.filter(i => i.id !== idea.id);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, idea];
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          {category === 'All' ? (
            <>Find Your Next{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                Project Idea
              </span>
            </>
          ) : (
            <><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{category}</span>{' Ideas'}</>
          )}
        </h1>
        <p className="text-muted-foreground text-base">
          Browse curated ideas or generate new ones with AI — then start building right away.
        </p>
      </div>

      {/* Filters */}
      <FiltersBar search={search} setSearch={(v) => { setSearch(v); setDisplayedIdeas(null); }} onSearch={handleSearch} />

      {/* Shuffle button */}
      <div className="mb-6 flex justify-center">
        <Button
          onClick={() => { setDisplayedIdeas(null); setSeed(Math.random()); }}
          className="gap-2 bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle Ideas
        </Button>
      </div>

      {/* Live idea discovery box */}
      <div className="mb-8">
        <div className={`relative rounded-2xl border-2 border-dashed bg-gradient-to-br from-primary/5 to-accent transition-colors ${micListening ? 'border-red-400' : 'border-primary/30 hover:border-primary/50'}`}>
          <textarea
            className="w-full min-h-[80px] bg-transparent px-5 py-4 pr-24 text-base resize-none focus:outline-none placeholder:text-muted-foreground/60 leading-relaxed"
            placeholder="✏️  Type your idea — e.g. 'tic tac toe game', 'chat app', 'todo CLI' — then press Enter or use the mic to generate variations."
            value={plannerText}
            onChange={e => {
              const val = e.target.value;
              setPlannerText(val);
              setAiIdeas(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                generateAiIdeas(plannerText);
              }
            }}
          />
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={togglePlannerMic}
              className={`p-1.5 rounded-md transition-colors ${micListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
              title={micListening ? 'Stop listening' : 'Speak your idea'}
            >
              {micListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            {plannerText && (
              <button
                onClick={() => { setPlannerText(''); setAiIdeas(null); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs bg-muted px-2 py-1 rounded-md">Clear</span>
              </button>
            )}
          </div>
        </div>
        {aiGenerating && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Generating ideas for "<span className="font-medium text-foreground">{plannerText}</span>"...
          </div>
        )}
      </div>

      {/* Ideas Grid — 16 columns on xl */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : aiGenerating ? null : filteredIdeas.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg font-medium">No ideas found</p>
          <p className="text-sm mt-1">Try different keywords or shuffle for new ideas.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr' }}>
          {filteredIdeas.map((idea, i) => {
            const saved = savedProjects.find(p => p.idea_id === idea.id || p.title === idea.title);
            const isComparing = compareIdeas.some(c => c.id === idea.id);
            const compareDisabled = compareIdeas.length >= 2 && !isComparing;
            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                index={i}
                onSave={handleSaveAndReturn}
                onOpen={setSelectedIdea}
                isSaving={saveProjectMutation.isPending}
                savedProjectId={saved?.id || null}
                isComparing={isComparing}
                compareDisabled={compareDisabled}
                onToggleCompare={toggleCompare}
              />
            );
          })}
        </div>
      )}

      <IdeaDetailModal
        idea={selectedIdea}
        open={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onSave={handleSaveAndReturn}
        isSaving={saveProjectMutation.isPending}
      />

      {/* Floating compare bar */}
      {compareIdeas.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-xl rounded-2xl px-5 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            {compareIdeas.length === 1 ? 'Select 1 more to compare' : '2 ideas selected'}
          </span>
          <div className="flex items-center gap-2">
            {compareIdeas.map(idea => (
              <div key={idea.id} className="flex items-center gap-1 bg-muted rounded-lg px-2.5 py-1 text-xs font-medium max-w-[140px] truncate">
                <span className="truncate">{idea.title}</span>
                <button onClick={() => toggleCompare(idea)} className="ml-1 text-muted-foreground hover:text-foreground shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="gap-1.5 h-8"
            disabled={compareIdeas.length < 2}
            onClick={() => setShowCompare(true)}
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            Compare
          </Button>
          <button onClick={() => setCompareIdeas([])} className="text-muted-foreground hover:text-foreground ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <IdeaCompareModal
        open={showCompare}
        onClose={() => setShowCompare(false)}
        ideas={compareIdeas}
        onSave={handleSaveAndReturn}
        isSaving={saveProjectMutation.isPending}
      />
    </div>
  );
}
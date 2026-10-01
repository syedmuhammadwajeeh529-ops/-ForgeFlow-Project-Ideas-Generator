import IdeaCard from "../components/ideas/IdeaCard";
import React, { useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FiltersBar from '@/components/ideas/FiltersBar';
import { Button } from '@/components/ui/button';
import { Shuffle, Mic, MicOff, Loader2 } from 'lucide-react';
import IdeaDetailModal from '@/components/ideas/IdeaDetailModal';
const SOFTWARE_IDEAS = [
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
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [generationKey, setGenerationKey] = useState(0);
  const [plannerText, setPlannerText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiIdeas, setAiIdeas] = useState(null);
  const debounceRef = useRef(null);
  const micRef = useRef(null);
  const [micListening, setMicListening] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const queryClient = useQueryClient();

  const category = new URLSearchParams(location.search).get('category') || 'All';

  const { data: savedProjects = [], isLoading: isLoadingSavedProjects } = useQuery({
  queryKey: ['saved-projects'],
  queryFn: async () => {
    const res = await fetch("http://localhost:5000/api/saved-projects");
    return res.json();
  },
});

  const savedTitles = savedProjects
    .map((project) => project.title)
    .filter((title) => typeof title === 'string' && title.trim());
  const savedTitleKey = savedTitles
    .map((title) => title.trim().toLocaleLowerCase())
    .sort()
    .join('|');

  const {
    data: generatedIdeas = [],
    isLoading: isLoadingGeneratedIdeas,
    isError: hasGenerationError,
  } = useQuery({
    queryKey: ['fresh-project-ideas', category, generationKey],
    enabled: !isLoadingSavedProjects && !plannerText.trim() && !aiGenerating,
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const params = new URLSearchParams({
        category,
        excluded_titles: JSON.stringify(savedTitles),
      });

      console.log("PROJECT IDEAS FETCH: React Query initial generation", {
        category,
        plannerText,
        aiGenerating,
      });

      const response = await fetch(`http://localhost:5000/api/project-ideas?${params}`);

      if (!response.ok) {
        throw new Error('Idea generation is temporarily unavailable.');
      }

      const ideas = await response.json();

      if (!Array.isArray(ideas)) {
        throw new Error('The idea generator returned an invalid response.');
      }

      return ideas;
    },
  });

  const saveProjectMutation = useMutation({
  mutationFn: async (idea) => {
    const response = await fetch("http://localhost:5000/api/saved-projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idea_id: idea.id,        title: idea.title,
        description: idea.description,
        difficulty: idea.difficulty,
        category: idea.category,
        tech_stack: idea.tech_stack || [],
        code: "",
        language: "javascript",
        notes: "",
        status: "saved",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save project");
    }

    return await response.json();
  },

  onSuccess: (result, idea) => {
  queryClient.setQueryData(['saved-projects'], (current = []) => {
    const nextProject = {
      id: result.id,
      idea_id: idea.id,
      title: idea.title,
      description: idea.description,
      difficulty: idea.difficulty,
      category: idea.category,
      tech_stack: idea.tech_stack || [],
      code: "",
      language: "javascript",
      notes: "",
      status: "saved",
    };

    if (current.some((project) => String(project.id) === String(result.id))) {
      return current;
    }

    return [...current, nextProject];
  });

  toast({
    title: "Project saved!",
    description: "Find it in My Projects.",
  });
},

  onError: (error) => {
    toast({
      title: "Save failed",
      description: error.message,
      variant: "destructive",
    });
  },
});

  const handleSearch = () => {
  // Small search box searches existing ideas only.
  // It must NOT trigger AI idea generation.
  setSearch(search.trim());
};

  const savedTitleSet = new Set(savedTitles.map((title) => title.trim().toLocaleLowerCase()));
  const isSavedIdea = (idea) => savedProjects.some(
    (project) => project.idea_id === idea.id
      || project.title?.trim().toLocaleLowerCase() === idea.title?.trim().toLocaleLowerCase()
  );
  const searchTerm = search.trim().toLocaleLowerCase();

  const filteredIdeas = (aiIdeas ?? generatedIdeas).filter((idea) => {
    if (
      isSavedIdea(idea) ||
      savedTitleSet.has(idea.title?.trim().toLocaleLowerCase())
    ) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    const searchableText = [
      idea.title,
      idea.description,
      idea.category,
      idea.difficulty,
      ...(idea.tech_stack || []),
      ...(idea.features || []),
      ...(idea.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    return searchableText.includes(searchTerm);
  });
console.log("GENERATED IDEAS:", generatedIdeas);
console.log("FILTERED IDEAS:", filteredIdeas);

  const generateAiIdeas = async (text) => {
    if (!text.trim()) { setAiIdeas(null); return; }
    setAiGenerating(true);
    try {
      const params = new URLSearchParams({
        prompt: text,
        category,
        excluded_titles: JSON.stringify(savedTitles),
      });
      const response = await fetch(`http://localhost:5000/api/project-ideas?${params}`);

      if (!response.ok) {
        throw new Error("Idea generation is temporarily unavailable.");
      }

      const ideas = await response.json();
      setAiIdeas(ideas.map((idea, i) => ({ ...idea, id: `ai-planner-${i}-${Date.now()}`, is_curated: false })));
    } catch (error) {
      toast({ title: "Could not generate ideas", description: error.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
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
      <FiltersBar search={search} setSearch={setSearch} onSearch={handleSearch} />

      {/* Shuffle button */}
      <div className="mb-6 flex justify-center">
        <Button
          onClick={async () => {
  setPlannerText('');
  setAiIdeas(null);
  setSearch('');
  setIdeaPrompt('');

  await queryClient.invalidateQueries({
    queryKey: ['fresh-project-ideas', category],
  });

  setGenerationKey((key) => key + 1);
}}
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
        {(aiGenerating || (!aiIdeas && isLoadingGeneratedIdeas)) && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            {aiGenerating ? (
              <>Generating ideas for "<span className="font-medium text-foreground">{plannerText}</span>"...</>
            ) : 'Finding five fresh ideas...'}
          </div>
        )}
      </div>

      {/* Ideas Grid — 16 columns on xl */}
      {aiGenerating || (!aiIdeas && isLoadingGeneratedIdeas) ? null : hasGenerationError ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg font-medium">Could not load fresh ideas</p>
          <p className="text-sm mt-1">Make sure the local API server is running, then try again.</p>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg font-medium">No ideas found</p>
          <p className="text-sm mt-1">Try different keywords or shuffle for new ideas.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr' }}>
         {filteredIdeas.map((idea, i) => (
  <IdeaCard
    key={idea.id}
    idea={idea}
    index={i}
    onSave={handleSaveAndReturn}
    onOpen={setSelectedIdea}
    isSaving={saveProjectMutation.isPending}
    savedProjectId={null}
  />
))}
        </div>
      )}

      <IdeaDetailModal
        idea={selectedIdea}
        open={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onSave={handleSaveAndReturn}
        isSaving={saveProjectMutation.isPending}
      />
    </div>
  );
}

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, Mic, MicOff } from 'lucide-react';

export default function FiltersBar({ search, setSearch, onSearch }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Try Chrome.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      setSearch(transcript);
      if (event.results[0].isFinal) {
        onSearch();
      }
    };

    recognition.start();
  };

  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search project ideas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-16 h-10 bg-card border-border"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {search && (
            <button onClick={() => setSearch('')} className="p-1">
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <button
            onClick={toggleMic}
            className={`p-1.5 rounded-md transition-colors ${listening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
            title={listening ? 'Stop listening' : 'Speak to search'}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
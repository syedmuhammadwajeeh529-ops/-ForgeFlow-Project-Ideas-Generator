import { useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, Code2, Loader2 } from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'bash', label: 'Bash' },
];

const PLACEHOLDERS = {
  javascript: '// Start coding your project here...\nconsole.log("Hello, World!");',
  typescript: '// TypeScript project\nconst greet = (name: string): string => {\n  return `Hello, ${name}!`;\n};\nconsole.log(greet("World"));',
  python: '# Start coding your project here\nprint("Hello, World!")',
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>',
  css: '/* Project styles */\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
  rust: 'fn main() {\n    println!("Hello, World!");\n}',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
  bash: '#!/bin/bash\necho "Hello, World!"',
};

export default function CodeEditor({ code, language, onChange, onSave, isSaving }) {
  const [localCode, setLocalCode] = useState(code || '');
  const [localLang, setLocalLang] = useState(language || 'javascript');

  const handleCodeChange = (e) => {
    setLocalCode(e.target.value);
    onChange(e.target.value, localLang);
  };

  const handleLangChange = (lang) => {
    setLocalLang(lang);
    if (!localCode) {
      const placeholder = PLACEHOLDERS[lang] || '';
      setLocalCode(placeholder);
      onChange(placeholder, lang);
    } else {
      onChange(localCode, lang);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = localCode.substring(0, start) + '  ' + localCode.substring(end);
      setLocalCode(newCode);
      onChange(newCode, localLang);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave(localCode, localLang);
    }
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-[#1a1a2e]">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#16213e] border-b border-white/10">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white/80 font-mono">Code Editor</span>
        </div>
        <div className="flex items-center gap-3">
          <Select value={localLang} onValueChange={handleLangChange}>
            <SelectTrigger className="w-36 h-7 text-xs bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90"
            onClick={() => onSave(localCode, localLang)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {isSaving ? 'Saving...' : 'Save (⌘S)'}
          </Button>
        </div>
      </div>

      {/* Code textarea */}
      <textarea
        className="flex-1 w-full p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none bg-[#1a1a2e] text-green-300 caret-primary"
        value={localCode}
        onChange={handleCodeChange}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDERS[localLang] || '// Start coding...'}
        spellCheck={false}
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
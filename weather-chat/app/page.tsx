import Link from 'next/link';
import Chat from '@/components/Chat';
import { Workflow } from 'lucide-react';

export default function Home() {
  return (
    <main className="h-screen bg-terminal-bg bg-grid overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Градиентное свечение */}
        <div 
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 217, 255, 0.15) 0%, transparent 50%)',
          }}
        />
        <div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-20"
          style={{
            background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 50%)',
          }}
        />
      </div>
      
      {/* Навигация */}
      <div className="fixed top-4 right-4 z-20">
        <Link 
          href="/tools"
          className="flex items-center gap-2 px-4 py-2 bg-terminal-surface border border-terminal-border rounded-lg hover:border-terminal-accent/50 hover:bg-terminal-accent/5 transition-all duration-200 text-sm text-terminal-muted hover:text-terminal-text"
        >
          <Workflow className="w-4 h-4" />
          MCP Tool Chain
        </Link>
      </div>
      
      {/* Контейнер чата */}
      <div className="relative z-10 h-full max-w-3xl mx-auto">
        <div className="h-full bg-terminal-bg/80 backdrop-blur-xl border-x border-terminal-border">
          <Chat />
        </div>
      </div>
    </main>
  );
}


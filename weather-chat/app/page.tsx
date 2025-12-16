import Chat from '@/components/Chat';

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
      
      {/* Контейнер чата */}
      <div className="relative z-10 h-full max-w-3xl mx-auto">
        <div className="h-full bg-terminal-bg/80 backdrop-blur-xl border-x border-terminal-border">
          <Chat />
        </div>
      </div>
    </main>
  );
}


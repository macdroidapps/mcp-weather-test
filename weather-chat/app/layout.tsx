import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Weather Chat | AI Погодный Ассистент',
  description: 'Чат с AI для получения информации о погоде в любом городе мира',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-terminal-bg text-terminal-text antialiased">
        {children}
      </body>
    </html>
  );
}


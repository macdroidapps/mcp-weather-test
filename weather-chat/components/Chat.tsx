'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType, ChatResponse } from '@/types/weather';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { CloudSun, Sparkles } from 'lucide-react';

// Генерация уникального ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Примеры запросов
const EXAMPLE_QUERIES = [
  'Какая погода сейчас в Москве?',
  'Что надеть в Риге?',
  'Можно ли бегать в Париже?',
  'Как погода в Берлине?',
];

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async (content: string) => {
    // Добавляем сообщение пользователя
    const userMessage: ChatMessageType = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    // Добавляем заглушку для ответа ассистента
    const loadingMessage: ChatMessageType = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    
    setMessages((prev) => [...prev, loadingMessage]);
    
    try {
      // Отправляем запрос к API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      
      const data: ChatResponse = await response.json();
      
      // Обновляем сообщение ассистента
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        if (data.error) {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: data.error,
            isLoading: false,
            isError: true,
          };
        } else {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: data.message,
            weatherData: data.weatherData,
            isLoading: false,
          };
        }
        
        return newMessages;
      });
      
    } catch (error) {
      // Обработка ошибок сети
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: 'Не удалось подключиться к серверу. Проверьте соединение.',
          isLoading: false,
          isError: true,
        };
        
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-terminal-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terminal-accent to-purple-500 flex items-center justify-center">
            <CloudSun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Weather Chat</h1>
            <p className="text-sm text-terminal-muted">AI-ассистент по погоде</p>
          </div>
        </div>
      </header>
      
      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.length === 0 ? (
          // Пустое состояние
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-terminal-accent/10 flex items-center justify-center mb-4 glow-accent">
              <Sparkles className="w-8 h-8 text-terminal-accent" />
            </div>
            
            <h2 className="font-display font-semibold text-xl mb-2">
              Привет! 👋
            </h2>
            <p className="text-terminal-muted mb-6 max-w-md">
              Спросите меня о погоде в любом городе на естественном языке. 
              Я автоматически понимаю запрос и запускаю нужные инструменты через Claude AI.
            </p>
            
            {/* Примеры запросов */}
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.map((query, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(query)}
                  className="
                    px-4 py-2 rounded-lg text-sm
                    bg-terminal-surface border border-terminal-border
                    hover:border-terminal-accent/50 hover:bg-terminal-accent/5
                    transition-all duration-200
                  "
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Список сообщений
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Ввод сообщения */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-terminal-border">
        <ChatInput 
          onSend={sendMessage} 
          disabled={isLoading}
          placeholder="Например: Какая погода сейчас в Москве?"
        />
      </div>
    </div>
  );
}


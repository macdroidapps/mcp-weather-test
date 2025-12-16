'use client';

import type { ChatMessage as ChatMessageType } from '@/types/weather';
import WeatherCard from './WeatherCard';
import { User, Bot, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={`
        flex gap-3 animate-slide-up
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
      `}
    >
      {/* Аватар */}
      <div 
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-terminal-accent/20 text-terminal-accent' 
            : 'bg-purple-500/20 text-purple-400'
          }
        `}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>
      
      {/* Контент сообщения */}
      <div 
        className={`
          flex-1 max-w-[80%] space-y-3
          ${isUser ? 'text-right' : 'text-left'}
        `}
      >
        {/* Текст сообщения */}
        <div 
          className={`
            inline-block px-4 py-3 rounded-2xl
            ${isUser 
              ? 'message-user rounded-tr-sm' 
              : 'message-assistant rounded-tl-sm'
            }
            ${message.isError ? 'border-terminal-error/50' : ''}
          `}
        >
          {message.isLoading ? (
            <div className="typing-indicator">
              <span />
              <span />
              <span />
            </div>
          ) : message.isError ? (
            <div className="flex items-center gap-2 text-terminal-error">
              <AlertCircle className="w-4 h-4" />
              <span>{message.content}</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
        
        {/* Карточка погоды (если есть) */}
        {message.weatherData && !isUser && (
          <WeatherCard data={message.weatherData} />
        )}
        
        {/* Время */}
        <div className="text-xs text-terminal-muted">
          {message.timestamp.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}


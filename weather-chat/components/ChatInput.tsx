'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ 
  onSend, 
  disabled = false,
  placeholder = 'Спросите о погоде...'
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Автоматическая подстройка высоты textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [message]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;
    
    onSend(trimmedMessage);
    setMessage('');
    
    // Сбрасываем высоту textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter без Shift отправляет сообщение
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-3 bg-terminal-surface border border-terminal-border rounded-xl p-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="
            flex-1 bg-transparent resize-none border-none outline-none
            text-black placeholder-terminal-muted
            px-2 py-2 max-h-36
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
        
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="
            flex-shrink-0 w-10 h-10 rounded-lg
            flex items-center justify-center
            bg-terminal-accent text-terminal-bg
            hover:bg-terminal-accent/90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            active:scale-95 disabled:active:scale-100
          "
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <p className="mt-2 text-xs text-terminal-muted text-center">
        Enter — отправить, Shift+Enter — новая строка
      </p>
    </form>
  );
}


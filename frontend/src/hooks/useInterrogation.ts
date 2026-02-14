import { useState, useCallback } from 'react';
import { streamChat } from '../api/client';
import api from '../api/client';
import type { ChatMessage, StreamEvent } from '../types';

export function useInterrogation(sessionId: string, characterSlug: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('calm');
  const [streamingText, setStreamingText] = useState('');
  const [initialized, setInitialized] = useState(false);

  const initInterrogation = useCallback(async () => {
    if (initialized) return;
    try {
      const { data } = await api.post(
        `/game/${sessionId}/interrogation/${characterSlug}/start`
      );
      setMessages(data.messages || []);
      setInitialized(true);
    } catch (err) {
      console.error('Failed to init interrogation:', err);
    }
  }, [sessionId, characterSlug, initialized]);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await api.get(
        `/game/${sessionId}/interrogation/${characterSlug}/history`
      );
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        setInitialized(true);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, [sessionId, characterSlug]);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText('');

    try {
      await streamChat(sessionId, characterSlug, { content }, (event: StreamEvent) => {
        if (event.type === 'stream') {
          setStreamingText((prev) => prev + (event.content || ''));
        } else if (event.type === 'emotion') {
          setCurrentEmotion(event.emotion || 'calm');
        } else if (event.type === 'done') {
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: event.full_response || '',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingText('');
        }
      });
    } catch (err) {
      console.error('Streaming error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId, characterSlug]);

  const showEvidence = useCallback(async (evidenceSlug: string, evidenceName: string) => {
    const systemMsg: ChatMessage = {
      role: 'user',
      content: `[Предъявлена улика: ${evidenceName}]`,
      timestamp: new Date().toISOString(),
      evidence_shown: evidenceSlug,
    };
    setMessages((prev) => [...prev, systemMsg]);
    setIsStreaming(true);
    setStreamingText('');

    try {
      await streamChat(sessionId, characterSlug, { evidence_slug: evidenceSlug }, (event: StreamEvent) => {
        if (event.type === 'stream') {
          setStreamingText((prev) => prev + (event.content || ''));
        } else if (event.type === 'emotion') {
          setCurrentEmotion(event.emotion || 'calm');
        } else if (event.type === 'done') {
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: event.full_response || '',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingText('');
        }
      });
    } catch (err) {
      console.error('Streaming error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId, characterSlug]);

  return {
    messages,
    sendMessage,
    showEvidence,
    isStreaming,
    streamingText,
    currentEmotion,
    initInterrogation,
    loadHistory,
    initialized,
  };
}

/**
 * Sales Agent Chat Component
 * Context-aware AI sales conversation interface
 */

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  startConversation,
  sendMessage,
  getConversationStage,
  endConversation,
  getStageDisplayName,
  getStageColor,
  type ConversationStage,
  type StartConversationRequest,
} from '@/lib/salesAgent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SalesAgentChatProps {
  missionId: string;
  prospectName?: string;
  prospectCompany?: string;
  prospectTitle?: string;
  prospectContext?: string;
  onClose?: () => void;
}

export default function SalesAgentChat({
  missionId,
  prospectName,
  prospectCompany,
  prospectTitle,
  prospectContext,
  onClose,
}: SalesAgentChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStage, setCurrentStage] = useState<ConversationStage>('introduction');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initializeConversation = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: StartConversationRequest = {
        mission_id: missionId,
        prospect_name: prospectName,
        prospect_company: prospectCompany,
        prospect_title: prospectTitle,
        prospect_context: prospectContext,
        salesperson_name: 'Alex',
        conversation_purpose: 'Qualify prospect and schedule demo',
      };

      const response = await startConversation(request);
      
      setConversationId(response.conversation_id);
      setCurrentStage(response.stage);
      setMessages([
        {
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendMessage({
        conversation_id: conversationId,
        message: inputValue,
      });

      setCurrentStage(response.stage);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.should_end) {
        setTimeout(() => {
          handleEndConversation();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleEndConversation = async () => {
    if (!conversationId) return;

    try {
      await endConversation(conversationId);
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Failed to end conversation:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">AI Sales Agent</h3>
          <p className="text-sm text-muted-foreground">
            {prospectName && `Talking to ${prospectName}`}
            {prospectCompany && ` at ${prospectCompany}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={`bg-${getStageColor(currentStage)}-100`}>
            {getStageDisplayName(currentStage)}
          </Badge>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={handleEndConversation}>
              End
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading || !conversationId}
          />
          <Button onClick={handleSendMessage} disabled={loading || !conversationId || !inputValue.trim()}>
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}

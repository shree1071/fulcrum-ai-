'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store';

export default function AskAIDrawer({ isOpen, onClose }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { simConfig, simType } = useStore();
  
  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setAnswer('');
    
    try {
      const response = await fetch('/api/physics-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          topic: simType,
          simConfig
        })
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  setAnswer(prev => prev + content);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      setAnswer('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Ask AI</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {answer && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">
                    {answer}
                  </div>
                </div>
              )}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="animate-spin">⟳</div>
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask about this simulation..."
                  className="flex-1 px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  onClick={handleAsk}
                  disabled={isLoading || !question.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  Ask
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

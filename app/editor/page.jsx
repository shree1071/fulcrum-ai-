'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from './store';
import { physicsKB } from '@/lib/physics-kb';
import AgentStatusBar from './components/AgentStatusBar';
import ParameterControls from './components/ParameterControls';
import Toolbar from './components/Toolbar';
import LevelSlider from './components/LevelSlider';
import ActionBar from './components/ActionBar';

const PhysicsScene = dynamic(() => import('./PhysicsScene'), { ssr: false });

export default function EditorPage() {
  const [topic, setTopic] = useState('');
  const [showWiki, setShowWiki] = useState(true);
  const [showCompileList, setShowCompileList] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const {
    journals,
    activeJournalId,
    simConfig,
    simType,
    violationState,
    isGenerating,
    agentStatus,
    qualityMode,
    createJournal,
    switchJournal,
    updateNotes,
    setSimConfig,
    setIsGenerating,
    setAgentStatus,
    setQualityMode,
    setSimType,
    deleteJournal,
    renameJournal,
    autoFix
  } = useStore();

  const activeJournal = journals.find(j => j.id === activeJournalId);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    let journalId = activeJournalId;
    if (!journalId) {
      journalId = createJournal(topic);
    }

    setIsGenerating(true);
    setAgentStatus('researching');

    try {
      const response = await fetch('/api/agent-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, qualityMode, journalId })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullNotes = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'agent_status') {
                setAgentStatus(data.status === 'complete' ? 'idle' : data.agent);
              } else if (data.type === 'token') {
                fullNotes += data.content;
                updateNotes(fullNotes);
              } else if (data.type === 'simconfig') {
                setSimConfig(data.data);
                setSimType(data.data.simType);
              } else if (data.type === 'done') {
                setIsGenerating(false);
                setAgentStatus('idle');
              } else if (data.type === 'error') {
                console.error('Pipeline error:', data.message);
                setIsGenerating(false);
                setAgentStatus('idle');
              }
            } catch (e) {
              console.error('Failed to parse SSE:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
      setAgentStatus('idle');
    }
  };

  const handleNewJournal = () => {
    const newId = createJournal('New Journal');
    setTopic('');
  };

  const handleDeleteJournal = (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this journal?')) {
      deleteJournal(id);
    }
  };

  const startRename = (journal, e) => {
    e.stopPropagation();
    setEditingJournalId(journal.id);
    setEditingTitle(journal.title);
  };

  const finishRename = () => {
    if (editingJournalId && editingTitle.trim()) {
      renameJournal(editingJournalId, editingTitle.trim());
    }
    setEditingJournalId(null);
    setEditingTitle('');
  };

  return (
    <div className="flex h-screen bg-[#0a0e1a] text-gray-100">
      {/* Left Sidebar - Journals */}
      <div className="w-56 bg-[#0d1117] border-r border-gray-800/50 flex flex-col">
        {/* Journal Header */}
        <div className="p-3 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Journal</span>
            <button
              onClick={handleNewJournal}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
              title="New Journal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {activeJournal && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="text-sm font-medium truncate">{activeJournal.title}</span>
              <button className="ml-auto text-gray-400 hover:text-white">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Search */}
        <div className="p-3 border-b border-gray-800/50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search journals..."
              className="w-full px-3 py-1.5 pl-8 bg-[#161b22] border border-gray-800 rounded text-sm focus:outline-none focus:border-indigo-500/50"
            />
            <svg className="w-4 h-4 absolute left-2.5 top-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Journal List */}
        <div className="flex-1 overflow-y-auto">
          {journals.map(journal => (
            <div
              key={journal.id}
              onClick={() => switchJournal(journal.id)}
              className={`group px-3 py-2 cursor-pointer transition-colors ${
                journal.id === activeJournalId 
                  ? 'bg-indigo-500/10' 
                  : 'hover:bg-gray-800/30'
              }`}
            >
              {editingJournalId === journal.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => e.key === 'Enter' && finishRename()}
                  className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm flex-1 truncate">{journal.title}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={(e) => startRename(journal, e)}
                      className="p-0.5 hover:bg-gray-700 rounded"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteJournal(journal.id, e)}
                      className="p-0.5 hover:bg-red-900/50 rounded"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="h-14 bg-[#0d1117] border-b border-gray-800/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
              <span className="font-semibold">Fulcrum</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border border-gray-800 rounded-lg">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm text-gray-400">Topic</span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="wind turbine physics"
                className="bg-transparent border-none outline-none text-sm w-48"
                disabled={isGenerating}
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            
            <div className="flex items-center gap-1 bg-[#161b22] border border-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => setQualityMode('high')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  qualityMode === 'high' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                High Quality
              </button>
              <button
                onClick={() => setQualityMode('fast')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  qualityMode === 'fast' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Fast
              </button>
            </div>
            
            <LevelSlider />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-400">LIVE</span>
            </div>
            
            <button className="px-3 py-1.5 bg-[#161b22] border border-gray-800 rounded-lg text-sm hover:bg-gray-800 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              System Ready
            </button>
            
            <button className="px-3 py-1.5 bg-[#161b22] border border-gray-800 rounded-lg text-sm hover:bg-gray-800 transition-colors">
              💬 Ask AI
            </button>
          </div>
        </div>
        
        {isGenerating && <AgentStatusBar status={agentStatus} />}
        
        {/* Toolbar */}
        <Toolbar onCompileWiki={() => setShowCompileList(!showCompileList)} />
        
        {/* Content Area - Wiki + 3D Sandbox */}
        <div className="flex-1 flex overflow-hidden">
          {/* Wiki Panel */}
          <AnimatePresence>
            {showWiki && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '40%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-[#0d1117] border-r border-gray-800/50 flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="font-semibold">Physics Wiki</h3>
                  </div>
                  <button
                    onClick={() => setShowWiki(false)}
                    className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {showCompileList ? (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <svg className="w-16 h-16 mx-auto mb-4 text-indigo-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="text-lg font-semibold mb-2">Your Physics Wiki</h3>
                        <p className="text-sm text-gray-400">Compile all your journals into a structured wiki. Edit the Expanding Knowledge Notebook and access more connections.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 mb-3">{journals.length} journals ready to compile</p>
                        
                        {journals.slice(0, 3).map((journal) => (
                          <div key={journal.id} className="flex items-center gap-3 p-3 bg-[#161b22] border border-gray-800 rounded-lg hover:border-indigo-500/50 transition-colors">
                            <div className="w-4 h-4 rounded border-2 border-indigo-500 flex items-center justify-center">
                              <div className="w-2 h-2 bg-indigo-500 rounded-sm"></div>
                            </div>
                            <span className="text-sm flex-1">{journal.title}</span>
                          </div>
                        ))}
                        
                        {journals.length > 3 && (
                          <button className="w-full text-center text-xs text-gray-500 hover:text-indigo-400 py-2">
                            +{journals.length - 3} more
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-6 p-4 bg-[#161b22] border border-indigo-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-xs font-medium text-indigo-400 mb-1">Karpathy LLM Wiki Pattern</p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Your journals are raw data. Compile compresses them into structured wiki articles with backlinks — just like Karpathy's evolving markdown knowledge base. Each compile enriches the previous version.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors">
                        🔮 Compile Wiki
                      </button>
                    </div>
                  ) : activeJournal?.notes ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                        {activeJournal.notes}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                      <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="text-sm mb-2">Your Physics Wiki</p>
                      <p className="text-xs">Compile all your journals into a structured wiki. Edit the Expanding Knowledge Notebook and access more connections.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 3D Sandbox */}
          <div className="flex-1 relative bg-[#0a0e1a]">
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              {!showWiki && (
                <button
                  onClick={() => setShowWiki(true)}
                  className="px-3 py-1.5 bg-[#161b22] border border-gray-800 rounded-lg text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Show Wiki
                </button>
              )}
              
              <div className="px-3 py-1.5 bg-[#161b22] border border-gray-800 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-400">3D Sandbox</span>
                <span className="text-xs font-medium">and Testing</span>
              </div>
              
              {simConfig && violationState === "OPTIMAL" && (
                <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-400">OPTIMAL</span>
                </div>
              )}
            </div>
            
            <PhysicsScene />
            {simConfig && <ParameterControls />}
            <ActionBar />
          </div>
        </div>
      </div>
    </div>
  );
}

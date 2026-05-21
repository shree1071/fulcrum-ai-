'use client';
import { motion } from 'framer-motion';

export default function AgentStatusBar({ status }) {
  const agents = [
    { name: 'research', label: 'Research' },
    { name: 'design', label: 'Design' },
    { name: 'validate', label: 'Validate' }
  ];
  
  const getAgentStatus = (agentName) => {
    if (status === 'idle') return 'idle';
    if (status === agentName) return 'running';
    
    const agentIndex = agents.findIndex(a => a.name === agentName);
    const currentIndex = agents.findIndex(a => a.name === status);
    
    if (currentIndex > agentIndex) return 'complete';
    return 'idle';
  };
  
  const getStatusIcon = (agentName) => {
    const agentStatus = getAgentStatus(agentName);
    if (agentStatus === 'complete') return '✓';
    if (agentStatus === 'running') return '⟳';
    return '○';
  };
  
  const getStatusColor = (agentName) => {
    const agentStatus = getAgentStatus(agentName);
    if (agentStatus === 'complete') return 'text-green-400';
    if (agentStatus === 'running') return 'text-blue-400';
    return 'text-gray-600';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 mt-3 px-2"
    >
      {agents.map((agent, i) => (
        <div key={agent.name} className="flex items-center gap-2">
          {i > 0 && <span className="text-gray-600">→</span>}
          <motion.div
            className="flex items-center gap-2"
            animate={getAgentStatus(agent.name) === 'running' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <span className={`text-lg ${getStatusColor(agent.name)} ${
              getAgentStatus(agent.name) === 'running' ? 'animate-spin' : ''
            }`}>
              {getStatusIcon(agent.name)}
            </span>
            <span className={`text-sm font-medium ${
              getAgentStatus(agent.name) === 'complete' ? 'text-green-400' :
              getAgentStatus(agent.name) === 'running' ? 'text-blue-400' :
              'text-gray-500'
            }`}>
              {agent.label}
            </span>
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}

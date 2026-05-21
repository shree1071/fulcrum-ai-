'use client';
import { motion } from 'framer-motion';
import useStore from '../store';
import { physicsKB } from '@/lib/physics-kb';

export default function StatusCard() {
  const { violationState, violations, simType, autoFix } = useStore();
  
  if (!simType || violationState === "OPTIMAL") return null;
  
  const handleAutoFix = () => {
    const changedParams = autoFix(physicsKB);
    if (changedParams && changedParams.length > 0) {
      console.log('Auto-fixed parameters:', changedParams);
    }
  };
  
  const getStateColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "bg-red-500/20 border-red-500";
    if (violationState === "WARNING") return "bg-yellow-500/20 border-yellow-500";
    return "bg-green-500/20 border-green-500";
  };
  
  const getStateText = () => {
    if (violationState === "CRITICAL_FAILURE") return "CRITICAL FAILURE";
    if (violationState === "WARNING") return "WARNING";
    return "OPTIMAL";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute bottom-4 right-4 w-80 p-4 rounded-lg border-2 ${getStateColor()} backdrop-blur-md z-10`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">{getStateText()}</h3>
        {violations.length > 0 && (
          <button
            onClick={handleAutoFix}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
          >
            Auto-Fix
          </button>
        )}
      </div>
      
      {violations.length > 0 && (
        <div className="space-y-2">
          {violations.map((violation, i) => (
            <div key={i} className="text-sm text-gray-200">
              <div className="font-semibold text-white">{violation.param}</div>
              <div className="text-xs">
                Current: <span className="text-red-400">{violation.value.toFixed(2)}</span>
                {' '}/{' '}
                Threshold: <span className="text-yellow-400">{violation.threshold.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{violation.message}</div>
            </div>
          ))}
        </div>
      )}
      
      {violations.length > 0 && violations[0].level === "CRITICAL_FAILURE" && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-300">
            {violations[0].message}
          </p>
        </div>
      )}
    </motion.div>
  );
}

'use client';
import { motion } from 'framer-motion';
import useStore from '../store';

export default function ParameterControls() {
  const { simConfig, updateParam, simType } = useStore();
  
  if (!simConfig || !simConfig.parameters) return null;
  
  const handleSliderChange = (paramName, value) => {
    updateParam(paramName, parseFloat(value));
  };
  
  const getParamRange = (paramName, currentValue) => {
    // Define sensible ranges for each parameter
    const ranges = {
      // Wind Turbine
      bladeLength: { min: 10, max: 100, step: 1 },
      rotationSpeed: { min: 0, max: 40, step: 0.5 },
      windSpeed: { min: 0, max: 50, step: 1 },
      numberOfBlades: { min: 2, max: 6, step: 1 },
      pitchAngle: { min: -15, max: 45, step: 1 },
      
      // Newton's Cradle
      ballMass: { min: 0.1, max: 2, step: 0.1 },
      stringLength: { min: 0.1, max: 1, step: 0.05 },
      releaseAngle: { min: 0, max: 90, step: 5 },
      numberOfBalls: { min: 3, max: 7, step: 1 },
      restitution: { min: 0.5, max: 1.0, step: 0.01 },
      
      // Rocket
      fuelMass: { min: 100, max: 5000, step: 100 },
      exhaustVelocity: { min: 1000, max: 8000, step: 100 },
      thrustForce: { min: 5000, max: 50000, step: 1000 },
      payloadMass: { min: 100, max: 2000, step: 50 },
      burnTime: { min: 30, max: 300, step: 10 },
      
      // Projectile
      initialVelocity: { min: 10, max: 200, step: 5 },
      launchAngle: { min: 0, max: 90, step: 5 },
      mass: { min: 0.1, max: 10, step: 0.1 },
      dragCoefficient: { min: 0, max: 2, step: 0.05 },
      gravity: { min: 1, max: 20, step: 0.5 },
      
      // Spring Mass
      springConstant: { min: 10, max: 500, step: 10 },
      dampingCoefficient: { min: 0, max: 5, step: 0.1 },
      amplitude: { min: 0.01, max: 2, step: 0.05 },
      frequency: { min: 0.1, max: 20, step: 0.5 },
      
      // Orbital
      centralMass: { min: 1e24, max: 1e25, step: 1e23 },
      orbitRadius: { min: 6.4e6, max: 1e7, step: 1e5 },
      orbitalVelocity: { min: 5000, max: 15000, step: 100 },
      eccentricity: { min: 0, max: 0.99, step: 0.01 },
      inclination: { min: 0, max: 90, step: 5 },
      
      // Bridge
      spanLength: { min: 10, max: 150, step: 5 },
      loadForce: { min: 1000, max: 50000, step: 1000 },
      beamDepth: { min: 0.5, max: 5, step: 0.1 },
      materialStrength: { min: 100e6, max: 500e6, step: 10e6 },
      numberOfSupports: { min: 2, max: 10, step: 1 },
      
      // Water Bottle
      wallThickness: { min: 0.0005, max: 0.005, step: 0.0001 },
      internalPressure: { min: 50000, max: 1000000, step: 10000 },
      bottleRadius: { min: 0.02, max: 0.1, step: 0.005 },
      materialStrength: { min: 10e6, max: 100e6, step: 5e6 },
      fillLevel: { min: 0, max: 1, step: 0.1 },
      
      // Robotic Arm
      link1Length: { min: 0.1, max: 1.5, step: 0.05 },
      link2Length: { min: 0.1, max: 1.5, step: 0.05 },
      jointAngle1: { min: -180, max: 180, step: 5 },
      jointAngle2: { min: -180, max: 180, step: 5 },
      payloadMass: { min: 0, max: 15, step: 0.5 },
      motorTorque: { min: 1, max: 30, step: 1 }
    };
    
    return ranges[paramName] || { min: 0, max: currentValue * 2, step: currentValue * 0.01 };
  };
  
  const formatValue = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0.00';
    const numValue = Number(value);
    if (numValue >= 1e6) return (numValue / 1e6).toFixed(1) + 'M';
    if (numValue >= 1e3) return (numValue / 1e3).toFixed(1) + 'k';
    if (numValue < 0.01 && numValue !== 0) return numValue.toExponential(2);
    return numValue.toFixed(2);
  };
  
  const getThresholdInfo = (paramName) => {
    const threshold = simConfig.thresholds?.[paramName];
    if (!threshold) return null;
    return threshold;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-4 top-20 w-80 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700 shadow-2xl z-20 max-h-[calc(100vh-120px)] overflow-y-auto"
    >
      <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-900/95 backdrop-blur-md">
        <h3 className="text-lg font-bold text-white">⚙️ Parameters</h3>
        <p className="text-xs text-gray-400 mt-1">Adjust values to see real-time changes</p>
      </div>
      
      <div className="p-4 space-y-4">
        {Object.entries(simConfig.parameters).map(([paramName, value]) => {
          const range = getParamRange(paramName, value);
          const threshold = getThresholdInfo(paramName);
          const isWarning = threshold && value >= threshold.warning;
          const isCritical = threshold && value >= threshold.critical;
          
          return (
            <div key={paramName} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-200 capitalize">
                  {paramName.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <span className={`text-sm font-mono px-2 py-0.5 rounded ${
                  isCritical ? 'bg-red-500/20 text-red-400' :
                  isWarning ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {formatValue(value)}
                </span>
              </div>
              
              <input
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={value}
                onChange={(e) => handleSliderChange(paramName, e.target.value)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: isCritical 
                    ? 'linear-gradient(to right, #ef4444 0%, #ef4444 100%)'
                    : isWarning
                    ? 'linear-gradient(to right, #eab308 0%, #eab308 100%)'
                    : 'linear-gradient(to right, #3b82f6 0%, #3b82f6 100%)'
                }}
              />
              
              {threshold && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Min: {formatValue(range.min)}</span>
                  <span className="text-yellow-500">⚠ {formatValue(threshold.warning)}</span>
                  <span className="text-red-500">🔴 {formatValue(threshold.critical)}</span>
                  <span>Max: {formatValue(range.max)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <p className="text-xs text-gray-400">
          💡 <strong>Tip:</strong> Drag sliders to adjust parameters. Watch the simulation respond in real-time!
        </p>
      </div>
    </motion.div>
  );
}

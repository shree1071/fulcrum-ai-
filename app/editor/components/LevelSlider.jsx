'use client';
import { useState } from 'react';

export default function LevelSlider() {
  const [level, setLevel] = useState(1); // 0: Beginner, 1: Intermediate, 2: Advanced

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500">Level</span>
      <div className="relative w-48">
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={level}
          onChange={(e) => setLevel(parseInt(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(level / 2) * 100}%, #374151 ${(level / 2) * 100}%, #374151 100%)`
          }}
        />
        <div className="flex justify-between mt-1">
          {levels.map((l, i) => (
            <span
              key={i}
              className={`text-xs transition-colors ${
                i === level ? 'text-indigo-400 font-medium' : 'text-gray-600'
              }`}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhysicsSpringMass({
  springConstant = 100,
  mass = 2.0,
  dampingCoefficient = 0.5,
  amplitude = 0.1,
  frequency = 1.0,
  violationState = "OPTIMAL"
}) {
  const massRef = useRef();
  const springRef = useRef();
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    // Damped harmonic oscillator: x(t) = A * e^(-γt) * cos(ωt)
    const omega = Math.sqrt(springConstant / mass);
    const gamma = dampingCoefficient / (2 * mass);
    
    let displacement;
    
    if (violationState === "CRITICAL_FAILURE") {
      // Undamped resonance - amplitude explosion
      displacement = amplitude * (1 + timeRef.current * 0.5) * Math.cos(omega * timeRef.current);
      displacement = Math.max(-5, Math.min(5, displacement)); // Clamp
    } else if (violationState === "WARNING") {
      // Slightly increased amplitude
      displacement = amplitude * 1.5 * Math.exp(-gamma * timeRef.current * 0.5) * Math.cos(omega * timeRef.current);
    } else {
      // Normal damped oscillation
      displacement = amplitude * Math.exp(-gamma * timeRef.current) * Math.cos(omega * timeRef.current);
    }
    
    if (massRef.current) {
      massRef.current.position.y = displacement;
    }
    
    // Spring visualization
    if (springRef.current) {
      springRef.current.scale.y = 1 - displacement * 2;
      springRef.current.position.y = 1 + displacement / 2;
    }
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#3b82f6";
  };
  
  return (
    <group>
      {/* Fixed support */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[2, 0.2, 0.5]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      
      {/* Spring */}
      <group ref={springRef} position={[0, 1, 0]}>
        {Array.from({ length: 20 }).map((_, i) => {
          const y = (i / 20) * 2 - 1;
          const angle = (i / 20) * Math.PI * 8;
          const radius = 0.2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                y,
                Math.sin(angle) * radius
              ]}
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#888888" />
            </mesh>
          );
        })}
      </group>
      
      {/* Mass */}
      <mesh ref={massRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color={getColor()}
          emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
          emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.5 : violationState === "WARNING" ? 0.2 : 0}
        />
      </mesh>
      
      {/* Failure effect - particles */}
      {violationState === "CRITICAL_FAILURE" && (
        <group>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} position={[
              (Math.random() - 0.5) * 2,
              Math.random() * 4 - 2,
              (Math.random() - 0.5) * 2
            ]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#ff0000" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

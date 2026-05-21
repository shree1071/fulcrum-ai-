'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhysicsWaterBottle({
  wallThickness = 0.002,
  internalPressure = 200000,
  bottleRadius = 0.04,
  materialStrength = 50e6,
  fillLevel = 0.8,
  violationState = "OPTIMAL"
}) {
  const bottleRef = useRef();
  const waterRef = useRef();
  const timeRef = useRef(0);
  
  // Hoop stress: σh = Pr/t
  const hoopStress = (internalPressure * bottleRadius) / wallThickness;
  
  // Burst pressure: Pb = 2σyt/r
  const burstPressure = (2 * materialStrength * wallThickness) / bottleRadius;
  
  const safetyFactor = burstPressure / internalPressure;
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (bottleRef.current) {
      if (violationState === "CRITICAL_FAILURE") {
        // Bulge and burst animation
        const bulge = 1 + Math.min(timeRef.current * 0.5, 1.5);
        bottleRef.current.scale.x = bulge;
        bottleRef.current.scale.z = bulge;
        bottleRef.current.scale.y = 1 / Math.sqrt(bulge); // Conservation of volume
        
        // Burst effect
        if (timeRef.current > 2) {
          bottleRef.current.material.opacity = Math.max(0.1, 1 - (timeRef.current - 2) * 0.5);
        }
      } else if (violationState === "WARNING") {
        // Slight bulge
        const bulge = 1 + Math.sin(timeRef.current * 3) * 0.1;
        bottleRef.current.scale.x = bulge;
        bottleRef.current.scale.z = bulge;
      } else {
        // Normal state
        bottleRef.current.scale.set(1, 1, 1);
        bottleRef.current.material.opacity = 0.3;
      }
    }
    
    // Water animation
    if (waterRef.current) {
      waterRef.current.position.y = -1 + fillLevel * 2 + Math.sin(timeRef.current * 2) * 0.05;
    }
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#88ccff";
  };
  
  const bottleHeight = 4;
  const scaledRadius = bottleRadius * 50; // Scale up for visualization
  
  return (
    <group>
      {/* Bottle body using LatheGeometry for realistic shape */}
      <mesh ref={bottleRef}>
        <cylinderGeometry args={[scaledRadius, scaledRadius * 0.8, bottleHeight, 32]} />
        <meshPhysicalMaterial 
          color={getColor()}
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.1}
          transmission={0.9}
          thickness={wallThickness * 1000}
          emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
          emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.3 : violationState === "WARNING" ? 0.1 : 0}
        />
      </mesh>
      
      {/* Bottle neck */}
      <mesh position={[0, bottleHeight / 2 + 0.5, 0]}>
        <cylinderGeometry args={[scaledRadius * 0.4, scaledRadius * 0.5, 1, 32]} />
        <meshPhysicalMaterial 
          color={getColor()}
          transparent
          opacity={0.3}
          roughness={0.1}
          transmission={0.9}
        />
      </mesh>
      
      {/* Cap */}
      <mesh position={[0, bottleHeight / 2 + 1.2, 0]}>
        <cylinderGeometry args={[scaledRadius * 0.45, scaledRadius * 0.45, 0.4, 32]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Water inside */}
      <mesh ref={waterRef} position={[0, -1 + fillLevel * 2, 0]}>
        <cylinderGeometry args={[scaledRadius * 0.9, scaledRadius * 0.7, fillLevel * bottleHeight, 32]} />
        <meshPhysicalMaterial 
          color="#0088ff"
          transparent
          opacity={0.6}
          roughness={0.0}
          metalness={0.1}
        />
      </mesh>
      
      {/* Burst particles */}
      {violationState === "CRITICAL_FAILURE" && timeRef.current > 2 && (
        <group>
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = (i / 30) * Math.PI * 2;
            const radius = (timeRef.current - 2) * 3;
            return (
              <mesh key={i} position={[
                Math.cos(angle) * radius,
                Math.sin(i * 0.5) * 2,
                Math.sin(angle) * radius
              ]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color="#88ccff" transparent opacity={0.6} />
              </mesh>
            );
          })}
        </group>
      )}
      
      {/* Pressure indicator rings */}
      {violationState === "WARNING" && (
        <>
          <mesh position={[0, 1, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[scaledRadius * 1.1, 0.05, 16, 32]} />
            <meshBasicMaterial color="#ffaa00" />
          </mesh>
          <mesh position={[0, -1, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[scaledRadius * 1.1, 0.05, 16, 32]} />
            <meshBasicMaterial color="#ffaa00" />
          </mesh>
        </>
      )}
    </group>
  );
}

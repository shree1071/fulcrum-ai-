'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhysicsBridge({
  spanLength = 50,
  loadForce = 10000,
  beamDepth = 2.0,
  materialStrength = 250e6,
  numberOfSupports = 2,
  violationState = "OPTIMAL"
}) {
  const bridgeRef = useRef();
  const timeRef = useRef(0);
  
  // Calculate deflection: δ = FL³/(48EI)
  const E = 200e9; // Young's modulus for steel
  const width = 3;
  const I = (width * Math.pow(beamDepth, 3)) / 12; // Second moment of area
  const deflection = (loadForce * Math.pow(spanLength, 3)) / (48 * E * I);
  
  // Bending stress: σ = My/I where M = FL/4
  const M = (loadForce * spanLength) / 4;
  const bendingStress = (M * (beamDepth / 2)) / I;
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (bridgeRef.current) {
      if (violationState === "CRITICAL_FAILURE") {
        // Bridge collapse animation
        const collapseAmount = Math.min(timeRef.current * 2, spanLength * 0.3);
        bridgeRef.current.rotation.x = Math.sin(timeRef.current * 2) * 0.3;
        bridgeRef.current.position.y = -collapseAmount;
        bridgeRef.current.scale.y = 1 - Math.min(timeRef.current * 0.1, 0.5);
      } else if (violationState === "WARNING") {
        // Visible sag
        bridgeRef.current.position.y = -deflection * 0.1 - Math.sin(timeRef.current * 2) * 0.5;
      } else {
        // Minimal deflection
        bridgeRef.current.position.y = -deflection * 0.01;
        bridgeRef.current.rotation.x = 0;
        bridgeRef.current.scale.y = 1;
      }
    }
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#888888";
  };
  
  const scaledSpan = spanLength / 10; // Scale for visualization
  const scaledDepth = beamDepth / 2;
  
  return (
    <group>
      {/* Supports */}
      {Array.from({ length: numberOfSupports }).map((_, i) => {
        const x = (i / (numberOfSupports - 1)) * scaledSpan - scaledSpan / 2;
        return (
          <mesh key={i} position={[x, -scaledDepth, 0]}>
            <cylinderGeometry args={[0.5, 0.8, scaledDepth * 2, 8]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        );
      })}
      
      {/* Bridge deck */}
      <group ref={bridgeRef}>
        <mesh>
          <boxGeometry args={[scaledSpan, scaledDepth, 3]} />
          <meshStandardMaterial 
            color={getColor()}
            emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
            emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.5 : violationState === "WARNING" ? 0.2 : 0}
          />
        </mesh>
        
        {/* Railings */}
        <mesh position={[0, scaledDepth / 2 + 0.3, 1.5]}>
          <boxGeometry args={[scaledSpan, 0.6, 0.1]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <mesh position={[0, scaledDepth / 2 + 0.3, -1.5]}>
          <boxGeometry args={[scaledSpan, 0.6, 0.1]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </group>
      
      {/* Load indicator */}
      <mesh position={[0, scaledDepth, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        <meshStandardMaterial color="#ff6600" />
      </mesh>
      
      {/* Failure debris */}
      {violationState === "CRITICAL_FAILURE" && (
        <group>
          {Array.from({ length: 15 }).map((_, i) => (
            <mesh key={i} position={[
              (Math.random() - 0.5) * scaledSpan,
              -Math.random() * scaledDepth * 2,
              (Math.random() - 0.5) * 3
            ]} rotation={[
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            ]}>
              <boxGeometry args={[
                Math.random() * 2 + 0.5,
                Math.random() * 1 + 0.3,
                Math.random() * 1 + 0.3
              ]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

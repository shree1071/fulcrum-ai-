'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhysicsNewtonsCradle({
  ballMass = 0.5,
  stringLength = 0.3,
  releaseAngle = 30,
  numberOfBalls = 5,
  restitution = 0.95,
  violationState = "OPTIMAL"
}) {
  const ballsRef = useRef([]);
  const timeRef = useRef(0);
  
  const spacing = 0.12;
  const ballRadius = 0.05;
  
  // Physics simulation state
  const ballStates = useMemo(() => {
    return Array.from({ length: numberOfBalls }).map((_, i) => ({
      angle: i === 0 ? THREE.MathUtils.degToRad(releaseAngle) : 0,
      velocity: 0,
      active: i === 0
    }));
  }, [numberOfBalls, releaseAngle]);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    const g = 9.81;
    
    ballStates.forEach((ball, i) => {
      if (violationState === "CRITICAL_FAILURE") {
        // Balls fly off or pass through each other
        ball.angle += ball.velocity * delta * 5;
        ball.velocity += (restitution > 1 ? 0.5 : -0.1) * delta;
        
        if (ballsRef.current[i]) {
          const x = (i - numberOfBalls / 2) * spacing + Math.sin(timeRef.current * 2 + i) * 0.5;
          const y = -stringLength * Math.cos(ball.angle) + Math.random() * 0.1;
          const z = stringLength * Math.sin(ball.angle) + Math.random() * 0.1;
          ballsRef.current[i].position.set(x, y, z);
        }
      } else {
        // Normal pendulum physics
        const acceleration = -(g / stringLength) * Math.sin(ball.angle);
        ball.velocity += acceleration * delta;
        ball.velocity *= restitution; // Energy loss
        ball.angle += ball.velocity * delta;
        
        if (ballsRef.current[i]) {
          const x = (i - numberOfBalls / 2) * spacing;
          const y = -stringLength * Math.cos(ball.angle);
          const z = stringLength * Math.sin(ball.angle);
          ballsRef.current[i].position.set(x, y, z);
        }
      }
    });
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#888888";
  };
  
  return (
    <group>
      {/* Support bar */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[numberOfBalls * spacing + 0.2, 0.02, 0.02]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Balls and strings */}
      {Array.from({ length: numberOfBalls }).map((_, i) => {
        const x = (i - numberOfBalls / 2) * spacing;
        return (
          <group key={i}>
            {/* String */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([x, 0, 0, x, -stringLength, 0])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#666666" />
            </line>
            
            {/* Ball */}
            <mesh
              ref={(el) => (ballsRef.current[i] = el)}
              position={[x, -stringLength, 0]}
            >
              <sphereGeometry args={[ballRadius, 16, 16]} />
              <meshStandardMaterial 
                color={getColor()}
                metalness={0.8}
                roughness={0.2}
                emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
                emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.5 : violationState === "WARNING" ? 0.2 : 0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhysicsRocket({
  fuelMass = 1000,
  exhaustVelocity = 3000,
  thrustForce = 15000,
  payloadMass = 500,
  burnTime = 120,
  violationState = "OPTIMAL"
}) {
  const rocketRef = useRef();
  const exhaustRef = useRef();
  const timeRef = useRef(0);
  const positionRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    // Tsiolkovsky rocket equation
    const totalMass = fuelMass + payloadMass;
    const finalMass = payloadMass;
    const deltaV = exhaustVelocity * Math.log(totalMass / finalMass);
    
    // Thrust-to-weight ratio
    const g = 9.81;
    const weight = totalMass * g;
    const twr = thrustForce / weight;
    
    if (violationState === "CRITICAL_FAILURE") {
      // Structural collapse
      if (rocketRef.current) {
        rocketRef.current.rotation.x = Math.sin(timeRef.current * 5) * 0.5;
        rocketRef.current.rotation.z = Math.cos(timeRef.current * 3) * 0.5;
        rocketRef.current.scale.y = 1 - Math.min(timeRef.current * 0.1, 0.5);
        positionRef.current += delta * 2;
      }
    } else {
      // Normal flight
      const acceleration = (thrustForce / totalMass) - g;
      positionRef.current += acceleration * delta * delta * 0.5;
      
      if (rocketRef.current) {
        rocketRef.current.position.y = positionRef.current;
        rocketRef.current.rotation.x = 0;
        rocketRef.current.rotation.z = 0;
        rocketRef.current.scale.y = 1;
      }
    }
    
    // Exhaust animation
    if (exhaustRef.current) {
      exhaustRef.current.scale.y = 1 + Math.sin(timeRef.current * 10) * 0.3;
      exhaustRef.current.material.opacity = 0.6 + Math.sin(timeRef.current * 15) * 0.2;
    }
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#e0e0e0";
  };
  
  const rocketHeight = 4;
  const rocketRadius = 0.5;
  
  return (
    <group ref={rocketRef}>
      {/* Rocket body */}
      <mesh position={[0, rocketHeight / 2, 0]}>
        <cylinderGeometry args={[rocketRadius, rocketRadius, rocketHeight, 16]} />
        <meshStandardMaterial 
          color={getColor()}
          metalness={0.7}
          roughness={0.3}
          emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
          emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.5 : violationState === "WARNING" ? 0.2 : 0}
        />
      </mesh>
      
      {/* Nose cone */}
      <mesh position={[0, rocketHeight + rocketRadius * 0.5, 0]}>
        <coneGeometry args={[rocketRadius, rocketRadius * 2, 16]} />
        <meshStandardMaterial color={getColor()} metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Fins */}
      {[0, 90, 180, 270].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(THREE.MathUtils.degToRad(angle)) * rocketRadius,
            rocketRadius,
            Math.sin(THREE.MathUtils.degToRad(angle)) * rocketRadius
          ]}
          rotation={[0, THREE.MathUtils.degToRad(angle), 0]}
        >
          <boxGeometry args={[0.1, 1, 0.8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      ))}
      
      {/* Exhaust plume */}
      <mesh ref={exhaustRef} position={[0, -0.5, 0]}>
        <coneGeometry args={[rocketRadius * 0.8, 2, 16]} />
        <meshBasicMaterial 
          color={violationState === "CRITICAL_FAILURE" ? "#ff0000" : "#ff6600"}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Failure particles */}
      {violationState === "CRITICAL_FAILURE" && (
        <group>
          {Array.from({ length: 15 }).map((_, i) => (
            <mesh key={i} position={[
              (Math.random() - 0.5) * 3,
              Math.random() * rocketHeight,
              (Math.random() - 0.5) * 3
            ]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

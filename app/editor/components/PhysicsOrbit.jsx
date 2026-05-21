'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhysicsOrbit({
  centralMass = 5.972e24,
  orbitRadius = 6.771e6,
  orbitalVelocity = 7700,
  eccentricity = 0.0,
  inclination = 0,
  violationState = "OPTIMAL"
}) {
  const satelliteRef = useRef();
  const orbitLineRef = useRef();
  const timeRef = useRef(0);
  
  // Scale down for visualization
  const scale = 1e-6;
  const radiusScaled = orbitRadius * scale;
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    const G = 6.674e-11;
    const period = 2 * Math.PI * Math.sqrt(Math.pow(orbitRadius, 3) / (G * centralMass));
    const angularVelocity = (2 * Math.PI) / period;
    
    if (violationState === "CRITICAL_FAILURE") {
      // Escape velocity exceeded - spiral outward
      const escapeRadius = radiusScaled * (1 + timeRef.current * 0.5);
      const angle = timeRef.current * 2;
      
      if (satelliteRef.current) {
        satelliteRef.current.position.x = Math.cos(angle) * escapeRadius;
        satelliteRef.current.position.z = Math.sin(angle) * escapeRadius;
        satelliteRef.current.position.y = Math.sin(timeRef.current) * radiusScaled * 0.5;
      }
    } else {
      // Elliptical orbit using Kepler's laws
      const a = radiusScaled; // semi-major axis
      const b = a * Math.sqrt(1 - eccentricity * eccentricity); // semi-minor axis
      const angle = timeRef.current * angularVelocity * 10; // Speed up for visualization
      
      if (satelliteRef.current) {
        const x = a * Math.cos(angle);
        const z = b * Math.sin(angle);
        const inclinationRad = THREE.MathUtils.degToRad(inclination);
        
        satelliteRef.current.position.x = x;
        satelliteRef.current.position.y = z * Math.sin(inclinationRad);
        satelliteRef.current.position.z = z * Math.cos(inclinationRad);
      }
    }
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#3b82f6";
  };
  
  // Generate orbit path
  const orbitPoints = [];
  const segments = 64;
  const a = radiusScaled;
  const b = a * Math.sqrt(1 - eccentricity * eccentricity);
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = a * Math.cos(angle);
    const z = b * Math.sin(angle);
    const inclinationRad = THREE.MathUtils.degToRad(inclination);
    orbitPoints.push(
      x,
      z * Math.sin(inclinationRad),
      z * Math.cos(inclinationRad)
    );
  }
  
  return (
    <group>
      {/* Central body (Earth) */}
      <mesh>
        <sphereGeometry args={[6.371, 32, 32]} />
        <meshStandardMaterial color="#2266ff" />
      </mesh>
      
      {/* Orbit path */}
      {violationState !== "CRITICAL_FAILURE" && (
        <line ref={orbitLineRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={orbitPoints.length / 3}
              array={new Float32Array(orbitPoints)}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#666666" opacity={0.5} transparent />
        </line>
      )}
      
      {/* Satellite */}
      <mesh ref={satelliteRef}>
        <boxGeometry args={[1, 1, 2]} />
        <meshStandardMaterial 
          color={getColor()}
          emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
          emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.5 : violationState === "WARNING" ? 0.2 : 0}
        />
      </mesh>
      
      {/* Solar panels */}
      <mesh ref={satelliteRef} position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Failure trail */}
      {violationState === "CRITICAL_FAILURE" && (
        <group>
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const radius = radiusScaled * (1 + i * 0.1);
            return (
              <mesh key={i} position={[
                Math.cos(angle) * radius,
                Math.sin(i) * radiusScaled * 0.3,
                Math.sin(angle) * radius
              ]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshBasicMaterial color="#ff0000" transparent opacity={0.4} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}

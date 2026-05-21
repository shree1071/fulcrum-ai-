'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhysicsWindTurbine({ 
  bladeLength = 45, 
  rotationSpeed = 15, 
  windSpeed = 12, 
  numberOfBlades = 3, 
  pitchAngle = 6,
  violationState = "OPTIMAL"
}) {
  const groupRef = useRef();
  const bladesRef = useRef();
  const particlesRef = useRef();
  
  // Convert rotation speed (RPM) to radians per second
  const angularVelocity = (rotationSpeed * 2 * Math.PI) / 60;
  
  // Create wind particle system
  const particles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = -bladeLength - Math.random() * 20;
      
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = windSpeed * 0.1;
    }
    
    return { positions, velocities, count };
  }, [bladeLength, windSpeed]);
  
  // Failure state colors with glow
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#3b82f6";
  };
  
  const getEmissive = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ff8800";
    return "#1e40af";
  };
  
  useFrame((state, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += angularVelocity * delta;
      
      // Critical failure: dramatic wobble and shake
      if (violationState === "CRITICAL_FAILURE") {
        const time = state.clock.elapsedTime;
        bladesRef.current.rotation.x = Math.sin(time * 5) * 0.4;
        bladesRef.current.rotation.y = Math.cos(time * 4) * 0.3;
        bladesRef.current.scale.setScalar(1 + Math.sin(time * 8) * 0.15);
        
        // Shake the whole turbine
        if (groupRef.current) {
          groupRef.current.position.x = Math.sin(time * 10) * 0.5;
          groupRef.current.position.y = Math.cos(time * 12) * 0.3;
        }
      } else if (violationState === "WARNING") {
        const time = state.clock.elapsedTime;
        bladesRef.current.rotation.x = Math.sin(time * 2) * 0.08;
        bladesRef.current.rotation.y = Math.cos(time * 1.5) * 0.05;
      } else {
        bladesRef.current.rotation.x = 0;
        bladesRef.current.rotation.y = 0;
        bladesRef.current.scale.setScalar(1);
        if (groupRef.current) {
          groupRef.current.position.x = 0;
          groupRef.current.position.y = 0;
        }
      }
    }
    
    // Animate wind particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < particles.count; i++) {
        positions[i * 3 + 2] += windSpeed * 0.02;
        
        // Reset particles that go too far
        if (positions[i * 3 + 2] > bladeLength * 2) {
          positions[i * 3 + 2] = -bladeLength - 20;
          positions[i * 3] = (Math.random() - 0.5) * 40;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  const bladeScale = bladeLength / 45;
  const color = getColor();
  const emissive = getEmissive();
  
  // Scale down the entire turbine to fit in viewport
  const globalScale = 0.15;
  
  return (
    <group ref={groupRef} scale={globalScale}>
      {/* Wind Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.count}
            array={particles.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.3}
          color={violationState === "CRITICAL_FAILURE" ? "#ff0000" : "#3b82f6"}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Tower with metallic finish */}
      <mesh position={[0, -bladeLength * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[bladeLength * 0.05, bladeLength * 0.08, bladeLength, 16]} />
        <meshStandardMaterial 
          color="#e0e0e0"
          metalness={0.8}
          roughness={0.2}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Nacelle with premium materials */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[bladeLength * 0.15, bladeLength * 0.1, bladeLength * 0.2]} />
        <meshStandardMaterial 
          color="#f5f5f5"
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      
      {/* Hub with glow effect */}
      <mesh position={[0, 0, bladeLength * 0.12]} castShadow>
        <sphereGeometry args={[bladeLength * 0.08, 32, 32]} />
        <meshStandardMaterial 
          color="#888888"
          metalness={0.9}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={violationState !== "OPTIMAL" ? 0.3 : 0}
        />
      </mesh>
      
      {/* Blades with premium materials and glow */}
      <group ref={bladesRef} position={[0, 0, bladeLength * 0.12]}>
        {Array.from({ length: numberOfBlades }).map((_, i) => {
          const angle = (i * 2 * Math.PI) / numberOfBlades;
          return (
            <group key={i} rotation={[0, 0, angle]}>
              <mesh 
                position={[bladeLength * bladeScale * 0.5, 0, 0]} 
                rotation={[0, 0, THREE.MathUtils.degToRad(pitchAngle)]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[bladeLength * bladeScale, bladeLength * 0.08, bladeLength * 0.02]} />
                <meshStandardMaterial 
                  color={color}
                  metalness={0.7}
                  roughness={0.2}
                  emissive={emissive}
                  emissiveIntensity={
                    violationState === "CRITICAL_FAILURE" ? 0.8 : 
                    violationState === "WARNING" ? 0.3 : 0.1
                  }
                  envMapIntensity={1.5}
                />
              </mesh>
              
              {/* Blade trail effect in critical state */}
              {violationState === "CRITICAL_FAILURE" && (
                <mesh 
                  position={[bladeLength * bladeScale * 0.5, 0, 0]} 
                  rotation={[0, 0, THREE.MathUtils.degToRad(pitchAngle)]}
                >
                  <boxGeometry args={[bladeLength * bladeScale * 1.1, bladeLength * 0.1, bladeLength * 0.03]} />
                  <meshBasicMaterial 
                    color="#ff0000"
                    transparent
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
      
      {/* Explosion particles in critical failure */}
      {violationState === "CRITICAL_FAILURE" && (
        <group>
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = (i / 30) * Math.PI * 2;
            const radius = 5 + Math.random() * 10;
            return (
              <mesh 
                key={i} 
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(angle) * radius,
                  bladeLength * 0.12
                ]}
              >
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshBasicMaterial 
                  color="#ff0000"
                  transparent
                  opacity={0.7}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}

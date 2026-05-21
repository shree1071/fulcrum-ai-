'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function HighQualityModel({ 
  violationState = "OPTIMAL",
  visualDescription = "",
  ...parameters
}) {
  const groupRef = useRef();
  const particlesRef = useRef();
  const secondaryRef = useRef();
  
  // Deep analysis of visual description to extract specific rendering instructions
  const visualConfig = useMemo(() => {
    const desc = visualDescription.toLowerCase();
    
    // Detect primary shape
    let primaryShape = 'sphere';
    if (desc.includes('cube') || desc.includes('box')) primaryShape = 'cube';
    if (desc.includes('cylinder') || desc.includes('tube')) primaryShape = 'cylinder';
    if (desc.includes('torus') || desc.includes('donut') || desc.includes('ring')) primaryShape = 'torus';
    if (desc.includes('cone') || desc.includes('pyramid')) primaryShape = 'cone';
    if (desc.includes('helix') || desc.includes('spiral') || desc.includes('dna')) primaryShape = 'helix';
    if (desc.includes('wave') || desc.includes('sine')) primaryShape = 'wave';
    
    // Detect secondary elements
    const hasOrbits = desc.includes('orbit') || desc.includes('revolv') || desc.includes('circle');
    const hasParticles = desc.includes('particle') || desc.includes('dot') || desc.includes('point');
    const hasTrails = desc.includes('trail') || desc.includes('path') || desc.includes('streak');
    const hasField = desc.includes('field') || desc.includes('aura') || desc.includes('glow');
    const hasWaves = desc.includes('wave') || desc.includes('ripple') || desc.includes('oscillat');
    const hasBeams = desc.includes('beam') || desc.includes('ray') || desc.includes('laser');
    const hasGrid = desc.includes('grid') || desc.includes('lattice') || desc.includes('mesh');
    
    // Detect colors
    let primaryColor = '#3b82f6';
    if (desc.includes('red') || desc.includes('hot')) primaryColor = '#ef4444';
    if (desc.includes('green') || desc.includes('emerald')) primaryColor = '#10b981';
    if (desc.includes('purple') || desc.includes('violet')) primaryColor = '#a855f7';
    if (desc.includes('yellow') || desc.includes('gold')) primaryColor = '#eab308';
    if (desc.includes('cyan') || desc.includes('blue')) primaryColor = '#06b6d4';
    if (desc.includes('orange')) primaryColor = '#f97316';
    
    // Detect animation style
    let animationStyle = 'rotate';
    if (desc.includes('pulse') || desc.includes('beat')) animationStyle = 'pulse';
    if (desc.includes('oscillat') || desc.includes('vibrat')) animationStyle = 'oscillate';
    if (desc.includes('expand') || desc.includes('grow')) animationStyle = 'expand';
    if (desc.includes('spin') || desc.includes('twist')) animationStyle = 'spin';
    
    // Detect complexity
    const complexity = desc.length > 200 ? 'high' : desc.length > 100 ? 'medium' : 'low';
    const elementCount = complexity === 'high' ? 8 : complexity === 'medium' ? 5 : 3;
    
    return {
      primaryShape,
      primaryColor,
      hasOrbits,
      hasParticles,
      hasTrails,
      hasField,
      hasWaves,
      hasBeams,
      hasGrid,
      animationStyle,
      elementCount,
      complexity
    };
  }, [visualDescription]);
  
  // Dynamic animation based on config
  useFrame((state, delta) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      
      switch (visualConfig.animationStyle) {
        case 'pulse':
          groupRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
          break;
        case 'oscillate':
          groupRef.current.position.y = Math.sin(time * 1.5) * 0.5;
          break;
        case 'expand':
          groupRef.current.scale.setScalar(1 + Math.sin(time) * 0.2);
          break;
        case 'spin':
          groupRef.current.rotation.y += delta * 1.5;
          groupRef.current.rotation.x += delta * 0.5;
          break;
        default:
          groupRef.current.rotation.y += delta * 0.5;
      }
      
      // Violation state overrides
      if (violationState === "CRITICAL_FAILURE") {
        groupRef.current.rotation.x = Math.sin(time * 5) * 0.4;
        groupRef.current.scale.setScalar(1 + Math.sin(time * 8) * 0.15);
      } else if (violationState === "WARNING") {
        groupRef.current.rotation.x = Math.sin(time * 2) * 0.1;
      }
    }
    
    if (particlesRef.current && visualConfig.hasParticles) {
      particlesRef.current.rotation.y += delta * 0.3;
      particlesRef.current.rotation.x += delta * 0.1;
    }
    
    if (secondaryRef.current && visualConfig.hasOrbits) {
      secondaryRef.current.rotation.z += delta * 0.8;
    }
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return visualConfig.primaryColor;
  };
  
  const color = getColor();
  const scale = 1.2;
  
  // Render primary shape
  const renderPrimaryShape = () => {
    const props = {
      castShadow: true,
      receiveShadow: true
    };
    
    const material = (
      <meshStandardMaterial 
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={violationState !== "OPTIMAL" ? 0.6 : 0.2}
      />
    );
    
    switch (visualConfig.primaryShape) {
      case 'cube':
        return <mesh {...props}><boxGeometry args={[2*scale, 2*scale, 2*scale]} />{material}</mesh>;
      case 'cylinder':
        return <mesh {...props}><cylinderGeometry args={[1*scale, 1*scale, 3*scale, 32]} />{material}</mesh>;
      case 'torus':
        return <mesh {...props}><torusGeometry args={[2*scale, 0.6*scale, 32, 100]} />{material}</mesh>;
      case 'cone':
        return <mesh {...props}><coneGeometry args={[1.5*scale, 3*scale, 32]} />{material}</mesh>;
      case 'helix':
        return <mesh {...props}><torusKnotGeometry args={[1.5*scale, 0.4*scale, 128, 16, 3, 2]} />{material}</mesh>;
      case 'wave':
        return <mesh {...props}><torusKnotGeometry args={[2*scale, 0.3*scale, 100, 16, 2, 3]} />{material}</mesh>;
      default:
        return <mesh {...props}><icosahedronGeometry args={[1.5*scale, 2]} />{material}</mesh>;
    }
  };
  
  return (
    <group ref={groupRef} scale={0.8}>
      {/* Primary Shape */}
      {renderPrimaryShape()}
      
      {/* Orbiting Elements */}
      {visualConfig.hasOrbits && (
        <group ref={secondaryRef}>
          {Array.from({ length: visualConfig.elementCount }).map((_, i) => {
            const angle = (i / visualConfig.elementCount) * Math.PI * 2;
            const radius = 3.5 * scale;
            return (
              <mesh 
                key={i}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(angle * 1.5) * 0.8,
                  Math.sin(angle) * radius
                ]}
                castShadow
              >
                <sphereGeometry args={[0.3 * scale, 16, 16]} />
                <meshStandardMaterial 
                  color={color}
                  metalness={0.9}
                  roughness={0.1}
                  emissive={color}
                  emissiveIntensity={0.4}
                />
              </mesh>
            );
          })}
        </group>
      )}
      
      {/* Particle System */}
      {visualConfig.hasParticles && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={visualConfig.complexity === 'high' ? 200 : 100}
              array={new Float32Array(
                Array.from({ length: (visualConfig.complexity === 'high' ? 600 : 300) }, 
                  () => (Math.random() - 0.5) * 12 * scale)
              )}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.08 * scale}
            color={color}
            transparent
            opacity={0.7}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
      
      {/* Energy Beams */}
      {visualConfig.hasBeams && Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 2, 0, Math.sin(angle) * 2]} rotation={[0, angle, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 8, 8]} />
            <meshBasicMaterial 
              color={color}
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
      
      {/* Wave Rings */}
      {visualConfig.hasWaves && Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, i * 0.8 - 1, 0]}>
          <torusGeometry args={[(2 + i * 0.5) * scale, 0.08, 16, 100]} />
          <meshStandardMaterial 
            color={color}
            transparent
            opacity={0.4 - i * 0.1}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
      
      {/* Field Grid */}
      {visualConfig.hasGrid && (
        <mesh>
          <sphereGeometry args={[5 * scale, 16, 16]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.08}
            wireframe
          />
        </mesh>
      )}
      
      {/* Energy Field */}
      {visualConfig.hasField && (
        <mesh>
          <sphereGeometry args={[4 * scale, 32, 32]} />
          <meshStandardMaterial 
            color={color}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {/* Trail Effect */}
      {visualConfig.hasTrails && Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5]}>
            <boxGeometry args={[0.1, 4, 0.1]} />
            <meshBasicMaterial 
              color={color}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
      
      {/* Critical Failure Effects */}
      {violationState === "CRITICAL_FAILURE" && (
        <>
          <mesh>
            <sphereGeometry args={[6 * scale, 32, 32]} />
            <meshBasicMaterial 
              color="#ff0000"
              transparent
              opacity={0.1}
              wireframe
            />
          </mesh>
          
          {/* Explosion particles */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 4 + Math.random() * 2;
            return (
              <mesh key={i} position={[
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 4,
                Math.sin(angle) * radius
              ]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial 
                  color="#ff0000"
                  transparent
                  opacity={0.8}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}
        </>
      )}
      
      {/* Base Platform */}
      <mesh position={[0, -3 * scale, 0]} receiveShadow>
        <cylinderGeometry args={[4 * scale, 4 * scale, 0.3, 64]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1}
        />
      </mesh>
    </group>
  );
}

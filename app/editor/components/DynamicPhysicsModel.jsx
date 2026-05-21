'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function DynamicPhysicsModel({ 
  violationState = "OPTIMAL",
  visualDescription = "",
  model3D = null,
  ...parameters
}) {
  const groupRef = useRef();
  const animationRefs = useRef([]);
  
  // Animation handler
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Animate each component based on its animation config
    animationRefs.current.forEach((ref, index) => {
      if (!ref || !ref.animation) return;
      
      const anim = ref.animation;
      
      switch (anim.type) {
        case 'rotate':
          if (anim.axis === 'x') ref.mesh.rotation.x += delta * (anim.speed || 1);
          if (anim.axis === 'y') ref.mesh.rotation.y += delta * (anim.speed || 1);
          if (anim.axis === 'z') ref.mesh.rotation.z += delta * (anim.speed || 1);
          break;
          
        case 'oscillate':
          const amplitude = anim.amplitude || 1;
          const frequency = anim.frequency || 1;
          const offset = Math.sin(time * frequency) * amplitude;
          if (anim.axis === 'x') ref.mesh.position.x = ref.initialPosition[0] + offset;
          if (anim.axis === 'y') ref.mesh.position.y = ref.initialPosition[1] + offset;
          if (anim.axis === 'z') ref.mesh.position.z = ref.initialPosition[2] + offset;
          break;
          
        case 'orbit':
          const radius = anim.radius || 5;
          const speed = anim.speed || 1;
          const angle = time * speed;
          ref.mesh.position.x = ref.initialPosition[0] + Math.cos(angle) * radius;
          ref.mesh.position.z = ref.initialPosition[2] + Math.sin(angle) * radius;
          break;
      }
    });
    
    // Violation effects on entire group
    if (violationState === "CRITICAL_FAILURE") {
      groupRef.current.rotation.x = Math.sin(time * 3) * 0.1;
      groupRef.current.scale.setScalar(1 + Math.sin(time * 5) * 0.05);
    } else if (violationState === "WARNING") {
      groupRef.current.rotation.x = Math.sin(time * 2) * 0.05;
    }
  });
  
  // Render AI-generated 3D model from structured JSON
  if (model3D && model3D.components && Array.isArray(model3D.components)) {
    const scale = model3D.scale || 1;
    const validComponents = model3D.components.filter(c => c && c.geometry && c.geometry.type);
    
    if (validComponents.length === 0) {
      console.warn('⚠️ No valid components in model3D');
      return renderFallback();
    }
    
    return (
      <group ref={groupRef} scale={scale}>
        {/* Ground plane */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <circleGeometry args={[12, 64]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        
        {validComponents.map((component, index) => {
          const { geometry, material = {}, position, rotation, scale: compScale, castShadow, animation } = component;
          
          // Create geometry
          let geometryElement;
          const geoType = geometry.type.toLowerCase();
          const args = geometry.args || [];
          
          // Validate args
          if (!Array.isArray(args) || args.length === 0) {
            console.warn(`⚠️ Component ${index}: invalid args for ${geoType}`);
            return null;
          }
          
          switch (geoType) {
            case 'sphere':
              geometryElement = <sphereGeometry args={args} />;
              break;
            case 'box':
              geometryElement = <boxGeometry args={args} />;
              break;
            case 'cylinder':
              geometryElement = <cylinderGeometry args={args} />;
              break;
            case 'cone':
              geometryElement = <coneGeometry args={args} />;
              break;
            case 'torus':
              geometryElement = <torusGeometry args={args} />;
              break;
            case 'capsule':
              geometryElement = <capsuleGeometry args={args} />;
              break;
            default:
              console.warn(`⚠️ Unknown geometry type: ${geoType}`);
              return null;
          }
          
          // Material properties with defaults
          const matProps = {
            color: material.color || '#3b82f6',
            metalness: material.metalness !== undefined ? material.metalness : 0.5,
            roughness: material.roughness !== undefined ? material.roughness : 0.5,
            ...(material.emissive && {
              emissive: material.emissive,
              emissiveIntensity: material.emissiveIntensity || 0.3
            }),
            ...(material.transparent && {
              transparent: true,
              opacity: material.opacity || 0.8
            })
          };
          
          // Apply violation state coloring
          if (violationState === "CRITICAL_FAILURE") {
            matProps.emissive = "#ff0000";
            matProps.emissiveIntensity = 0.5;
          } else if (violationState === "WARNING") {
            matProps.emissive = "#ffaa00";
            matProps.emissiveIntensity = 0.3;
          }
          
          return (
            <mesh
              key={index}
              ref={(el) => {
                if (el && animation) {
                  animationRefs.current[index] = {
                    mesh: el,
                    animation,
                    initialPosition: position || [0, 0, 0]
                  };
                }
              }}
              position={position || [0, 0, 0]}
              rotation={rotation || [0, 0, 0]}
              scale={compScale || [1, 1, 1]}
              castShadow={castShadow !== false}
              receiveShadow
            >
              {geometryElement}
              <meshStandardMaterial {...matProps} />
            </mesh>
          );
        })}
      </group>
    );
  }
  
  // Fallback rendering function
  function renderFallback() {
  
    const desc = (visualDescription || '').toLowerCase();
    
    // Determine color from description
    const getColor = () => {
      if (desc.includes('red')) return '#ef4444';
      if (desc.includes('green')) return '#10b981';
      if (desc.includes('purple')) return '#a855f7';
      if (desc.includes('yellow')) return '#eab308';
      if (desc.includes('blue')) return '#3b82f6';
      if (desc.includes('orange')) return '#f97316';
      if (desc.includes('cyan')) return '#06b6d4';
      return '#3b82f6';
    };
    
    const color = violationState === "CRITICAL_FAILURE" ? "#ff0000" : 
                  violationState === "WARNING" ? "#ffaa00" : getColor();
    
    // Generic fallback visualization
    return (
      <group ref={groupRef} scale={0.8}>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <circleGeometry args={[12, 64]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        
        <mesh castShadow>
          <icosahedronGeometry args={[2, 2]} />
          <meshStandardMaterial 
            color={color}
            metalness={0.8}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Orbiting particles */}
        {[0, 1, 2].map((i) => (
          <mesh 
            key={i}
            position={[
              Math.cos((i / 3) * Math.PI * 2) * 4,
              0,
              Math.sin((i / 3) * Math.PI * 2) * 4
            ]}
            castShadow
          >
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={color}
              metalness={0.7}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>
    );
  }
  
  // No model3D found - use fallback
  return renderFallback();
}

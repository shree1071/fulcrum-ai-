'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import { Suspense } from 'react';
import useStore from './store';
import StatusCard from './components/StatusCard';

// Import all physics components
import PhysicsWindTurbine from './components/PhysicsWindTurbine';
import PhysicsNewtonsCradle from './components/PhysicsNewtonsCradle';
import PhysicsRocket from './components/PhysicsRocket';
import PhysicsProjectile from './components/PhysicsProjectile';
import PhysicsSpringMass from './components/PhysicsSpringMass';
import PhysicsOrbit from './components/PhysicsOrbit';
import PhysicsBridge from './components/PhysicsBridge';
import PhysicsWaterBottle from './components/PhysicsWaterBottle';
import Arm from './components/Arm';
import DynamicPhysicsModel from './components/DynamicPhysicsModel';
import DynamicR3FScene from './components/DynamicR3FScene';

function Scene() {
  const { simType, simConfig, violationState } = useStore();
  
  if (!simType || !simConfig) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#3b82f6" wireframe />
        </mesh>
      </group>
    );
  }
  
  const params = { 
    ...simConfig.parameters, 
    violationState,
    visualDescription: simConfig.visualDescription || "",
    model3D: simConfig.model3D || null
  };
  
  switch (simType) {
    case 'wind_turbine':
      return <PhysicsWindTurbine {...params} />;
    case 'newton_cradle':
      return <PhysicsNewtonsCradle {...params} />;
    case 'rocket':
      return <PhysicsRocket {...params} />;
    case 'projectile':
      return <PhysicsProjectile {...params} />;
    case 'spring_mass':
      return <PhysicsSpringMass {...params} />;
    case 'orbital':
      return <PhysicsOrbit {...params} />;
    case 'bridge':
      return <PhysicsBridge {...params} />;
    case 'water_bottle':
      return <PhysicsWaterBottle {...params} />;
    case 'robotic_arm':
      return <Arm {...params} />;
    case 'custom':
      // Use R3F code if available, otherwise JSON model
      if (simConfig.r3fCode) {
        return (
          <DynamicR3FScene
            code={simConfig.r3fCode}
            params={simConfig.parameters}
            violationState={violationState}
          />
        );
      }
      return <DynamicPhysicsModel {...params} />;
    default:
      return <DynamicPhysicsModel {...params} />;
  }
}

export default function PhysicsScene() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] relative">
      <Canvas
        camera={{ position: [15, 8, 15], fov: 60 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        shadows
      >
        <Suspense fallback={null}>
          {/* Dramatic Lighting Setup */}
          <ambientLight intensity={0.2} />
          <directionalLight 
            position={[10, 15, 5]} 
            intensity={1.5} 
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-10, 10, -5]} intensity={0.8} color="#3b82f6" />
          <pointLight position={[10, -10, 5]} intensity={0.6} color="#06b6d4" />
          <spotLight
            position={[0, 20, 0]}
            angle={0.3}
            penumbra={1}
            intensity={1}
            castShadow
            color="#ffffff"
          />
          
          {/* Scene Content */}
          <Scene />
          
          {/* Enhanced Controls */}
          <OrbitControls 
            enableDamping
            dampingFactor={0.03}
            minDistance={8}
            maxDistance={60}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate={false}
            autoRotateSpeed={0.5}
            target={[0, 0, 0]}
          />
          
          {/* Premium Environment */}
          <Environment preset="night" />
          
          {/* Subtle Ground Plane with Reflection */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -5, 0]} 
            receiveShadow
          >
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial 
              color="#0a0a0f"
              metalness={0.9}
              roughness={0.1}
              envMapIntensity={0.5}
            />
          </mesh>
          
          {/* Atmospheric Fog */}
          <fog attach="fog" args={['#0a0a0f', 30, 80]} />
          
          {/* Subtle Particles in Background */}
          <Stars 
            radius={100} 
            depth={50} 
            count={1000} 
            factor={4} 
            saturation={0} 
            fade 
            speed={0.5}
          />
        </Suspense>
      </Canvas>
      
      <StatusCard />
    </div>
  );
}

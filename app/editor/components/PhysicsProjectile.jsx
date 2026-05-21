'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhysicsProjectile({
  initialVelocity = 50,
  launchAngle = 45,
  mass = 1.0,
  dragCoefficient = 0.47,
  gravity = 9.81,
  violationState = "OPTIMAL"
}) {
  const projectileRef = useRef();
  const trailRef = useRef([]);
  const timeRef = useRef(0);
  
  const trajectory = useMemo(() => {
    const points = [];
    const angleRad = THREE.MathUtils.degToRad(launchAngle);
    const vx = initialVelocity * Math.cos(angleRad);
    const vy = initialVelocity * Math.sin(angleRad);
    
    const dt = 0.1;
    let t = 0;
    let x = 0;
    let y = 0;
    let vxCurrent = vx;
    let vyCurrent = vy;
    
    // Simulate trajectory with drag
    while (y >= 0 && t < 20) {
      points.push(new THREE.Vector3(x, y, 0));
      
      const v = Math.sqrt(vxCurrent * vxCurrent + vyCurrent * vyCurrent);
      const rho = 1.225; // air density
      const area = 0.01; // cross-sectional area
      const dragForce = 0.5 * rho * dragCoefficient * area * v * v;
      const dragAccelX = -(dragForce / mass) * (vxCurrent / v);
      const dragAccelY = -(dragForce / mass) * (vyCurrent / v);
      
      vxCurrent += dragAccelX * dt;
      vyCurrent += (dragAccelY - gravity) * dt;
      
      x += vxCurrent * dt;
      y += vyCurrent * dt;
      t += dt;
    }
    
    return points;
  }, [initialVelocity, launchAngle, mass, dragCoefficient, gravity]);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (violationState === "CRITICAL_FAILURE") {
      // Nonsensical trajectory
      if (projectileRef.current) {
        projectileRef.current.position.x = Math.sin(timeRef.current * 3) * 20;
        projectileRef.current.position.y = Math.abs(Math.cos(timeRef.current * 2)) * 15;
        projectileRef.current.position.z = Math.sin(timeRef.current * 4) * 10;
      }
    } else {
      // Follow calculated trajectory
      const speed = violationState === "WARNING" ? 2 : 1;
      const index = Math.floor((timeRef.current * speed * 10) % trajectory.length);
      
      if (projectileRef.current && trajectory[index]) {
        projectileRef.current.position.copy(trajectory[index]);
      }
    }
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#3b82f6";
  };
  
  return (
    <group>
      {/* Projectile */}
      <mesh ref={projectileRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={getColor()}
          emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
          emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.5 : violationState === "WARNING" ? 0.2 : 0}
        />
      </mesh>
      
      {/* Trajectory path */}
      {!violationState || violationState === "OPTIMAL" ? (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trajectory.length}
              array={new Float32Array(trajectory.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#3b82f6" opacity={0.3} transparent />
        </line>
      ) : null}
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      
      {/* Launch point marker */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    </group>
  );
}

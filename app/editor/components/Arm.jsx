'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Arm({
  link1Length = 0.5,
  link2Length = 0.4,
  jointAngle1 = 45,
  jointAngle2 = 30,
  payloadMass = 2.0,
  motorTorque = 10,
  violationState = "OPTIMAL"
}) {
  const baseRef = useRef();
  const link1Ref = useRef();
  const link2Ref = useRef();
  const endEffectorRef = useRef();
  const timeRef = useRef(0);
  
  const angle1Rad = THREE.MathUtils.degToRad(jointAngle1);
  const angle2Rad = THREE.MathUtils.degToRad(jointAngle2);
  
  // Forward kinematics
  const x = link1Length * Math.cos(angle1Rad) + link2Length * Math.cos(angle1Rad + angle2Rad);
  const y = link1Length * Math.sin(angle1Rad) + link2Length * Math.sin(angle1Rad + angle2Rad);
  
  // Torque calculation
  const g = 9.81;
  const requiredTorque = payloadMass * g * (link1Length + link2Length);
  const torqueExceeded = requiredTorque > motorTorque;
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (violationState === "CRITICAL_FAILURE") {
      // Joint collapse
      if (link1Ref.current) {
        link1Ref.current.rotation.z = angle1Rad - Math.min(timeRef.current * 0.5, Math.PI / 2);
      }
      if (link2Ref.current) {
        link2Ref.current.rotation.z = angle2Rad - Math.min(timeRef.current * 0.3, Math.PI / 3);
      }
      if (endEffectorRef.current) {
        endEffectorRef.current.position.y -= delta * 0.5;
      }
    } else if (violationState === "WARNING") {
      // Slight wobble
      if (link1Ref.current) {
        link1Ref.current.rotation.z = angle1Rad + Math.sin(timeRef.current * 3) * 0.1;
      }
      if (link2Ref.current) {
        link2Ref.current.rotation.z = angle2Rad + Math.cos(timeRef.current * 4) * 0.08;
      }
    } else {
      // Normal operation
      if (link1Ref.current) {
        link1Ref.current.rotation.z = angle1Rad;
      }
      if (link2Ref.current) {
        link2Ref.current.rotation.z = angle2Rad;
      }
    }
  });
  
  const getColor = () => {
    if (violationState === "CRITICAL_FAILURE") return "#ff0000";
    if (violationState === "WARNING") return "#ffaa00";
    return "#3b82f6";
  };
  
  const link1Scale = link1Length * 2;
  const link2Scale = link2Length * 2;
  
  return (
    <group>
      {/* Base */}
      <mesh ref={baseRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.5, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      
      {/* Joint 1 */}
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      
      {/* Link 1 */}
      <group position={[0, 0.25, 0]}>
        <group ref={link1Ref}>
          <mesh position={[link1Scale / 2, 0, 0]}>
            <boxGeometry args={[link1Scale, 0.15, 0.15]} />
            <meshStandardMaterial 
              color={getColor()}
              emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
              emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.5 : violationState === "WARNING" ? 0.2 : 0}
            />
          </mesh>
          
          {/* Joint 2 */}
          <mesh position={[link1Scale, 0, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#444444" />
          </mesh>
          
          {/* Link 2 */}
          <group position={[link1Scale, 0, 0]}>
            <group ref={link2Ref}>
              <mesh position={[link2Scale / 2, 0, 0]}>
                <boxGeometry args={[link2Scale, 0.12, 0.12]} />
                <meshStandardMaterial 
                  color={getColor()}
                  emissive={violationState !== "OPTIMAL" ? getColor() : "#000000"}
                  emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.5 : violationState === "WARNING" ? 0.2 : 0}
                />
              </mesh>
              
              {/* End effector / gripper */}
              <group ref={endEffectorRef} position={[link2Scale, 0, 0]}>
                <mesh position={[0.1, 0.08, 0]}>
                  <boxGeometry args={[0.15, 0.15, 0.05]} />
                  <meshStandardMaterial color="#888888" />
                </mesh>
                <mesh position={[0.1, -0.08, 0]}>
                  <boxGeometry args={[0.15, 0.15, 0.05]} />
                  <meshStandardMaterial color="#888888" />
                </mesh>
                
                {/* Payload */}
                <mesh position={[0.1, 0, 0]}>
                  <boxGeometry args={[0.2, 0.2, 0.2]} />
                  <meshStandardMaterial 
                    color="#ff6600"
                    emissive={violationState === "CRITICAL_FAILURE" ? "#ff0000" : "#000000"}
                    emissiveIntensity={violationState === "CRITICAL_FAILURE" ? 0.3 : 0}
                  />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
      
      {/* Failure sparks */}
      {violationState === "CRITICAL_FAILURE" && (
        <group>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} position={[
              Math.random() * link1Scale,
              0.25 + Math.random() * 0.5,
              (Math.random() - 0.5) * 0.5
            ]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

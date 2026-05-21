'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * DynamicR3FScene - Safely evaluates and renders AI-generated R3F components
 * 
 * Takes JSX code string and evaluates it in a sandboxed environment with
 * access to React Three Fiber hooks and Three.js
 */
export default function DynamicR3FScene({ code, params = {}, violationState = "OPTIMAL" }) {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!code || typeof code !== 'string') {
      setError('No code provided');
      return;
    }
    
    try {
      // Create sandbox with R3F and Three.js globals
      const sandbox = {
        React: { useRef, useState, useEffect, useMemo },
        useRef,
        useState,
        useEffect,
        useMemo,
        useFrame,
        useThree,
        THREE,
        Math,
        console,
      };
      
      // Build function parameters from sandbox
      const paramNames = Object.keys(sandbox);
      const paramValues = Object.values(sandbox);
      
      // Wrap code to return the GeneratedScene component
      const wrappedCode = `
        ${code}
        return typeof GeneratedScene !== 'undefined' ? GeneratedScene : null;
      `;
      
      // Create and execute function
      const fn = new Function(...paramNames, wrappedCode);
      const GeneratedComponent = fn(...paramValues);
      
      if (!GeneratedComponent) {
        throw new Error('GeneratedScene component not found in code');
      }
      
      setComponent(() => GeneratedComponent);
      setError(null);
      
    } catch (err) {
      console.error('[DynamicR3FScene] Evaluation error:', err);
      setError(err.message);
      setComponent(null);
    }
  }, [code]);
  
  // Render component or fallback
  if (error) {
    return <ErrorFallback error={error} violationState={violationState} />;
  }
  
  if (!Component) {
    return <LoadingFallback />;
  }
  
  try {
    return <Component params={params} violationState={violationState} />;
  } catch (renderError) {
    console.error('[DynamicR3FScene] Render error:', renderError);
    return <ErrorFallback error={renderError.message} violationState={violationState} />;
  }
}

function LoadingFallback() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" wireframe />
      </mesh>
    </group>
  );
}

function ErrorFallback({ error, violationState }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });
  
  const color = violationState === "CRITICAL_FAILURE" ? "#ff0000" : 
                violationState === "WARNING" ? "#ffaa00" : "#ef4444";
  
  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      
      <mesh castShadow>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial 
          color={color}
          wireframe
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

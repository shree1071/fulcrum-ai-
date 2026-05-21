// Pre-built, high-quality 3D model templates for common physics topics
// These are professionally designed and physics-accurate

export interface Model3D {
  components: Array<{
    type: 'mesh';
    geometry: {
      type: string;
      args: number[];
    };
    material: {
      color: string;
      metalness: number;
      roughness: number;
      emissive?: string;
      emissiveIntensity?: number;
      transparent?: boolean;
      opacity?: number;
    };
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    castShadow?: boolean;
    animation?: {
      type: 'rotate' | 'oscillate' | 'orbit';
      axis?: 'x' | 'y' | 'z';
      speed?: number;
      amplitude?: number;
      frequency?: number;
      radius?: number;
    };
  }>;
  scale: number;
}

export const modelTemplates: Record<string, Model3D> = {
  helicopter: {
    scale: 0.15,
    components: [
      // Main body
      { type: 'mesh', geometry: { type: 'box', args: [8, 3, 3] }, material: { color: '#2563eb', metalness: 0.7, roughness: 0.3 }, position: [0, 0, 0], castShadow: true },
      // Cockpit
      { type: 'mesh', geometry: { type: 'sphere', args: [2, 32, 32] }, material: { color: '#444444', metalness: 0.3, roughness: 0.1, transparent: true, opacity: 0.7 }, position: [3, 1, 0], castShadow: true },
      // Main rotor hub
      { type: 'mesh', geometry: { type: 'cylinder', args: [0.5, 0.5, 1, 32] }, material: { color: '#666666', metalness: 0.9, roughness: 0.1 }, position: [0, 4, 0], castShadow: true },
      // Main rotor blades
      { type: 'mesh', geometry: { type: 'box', args: [12, 0.15, 0.8] }, material: { color: '#222222', metalness: 0.8, roughness: 0.2 }, position: [0, 4.5, 0], castShadow: true, animation: { type: 'rotate', axis: 'y', speed: 12 } },
      { type: 'mesh', geometry: { type: 'box', args: [12, 0.15, 0.8] }, material: { color: '#222222', metalness: 0.8, roughness: 0.2 }, position: [0, 4.5, 0], rotation: [0, 1.57, 0], castShadow: true, animation: { type: 'rotate', axis: 'y', speed: 12 } },
      // Tail boom
      { type: 'mesh', geometry: { type: 'cylinder', args: [0.4, 0.4, 8, 16] }, material: { color: '#555555', metalness: 0.7, roughness: 0.3 }, position: [-6, 0, 0], rotation: [0, 0, 1.57], castShadow: true },
      // Tail rotor
      { type: 'mesh', geometry: { type: 'box', args: [2, 0.1, 0.4] }, material: { color: '#222222', metalness: 0.8, roughness: 0.2 }, position: [-10, 0, 0], castShadow: true, animation: { type: 'rotate', axis: 'x', speed: 15 } },
      { type: 'mesh', geometry: { type: 'box', args: [2, 0.1, 0.4] }, material: { color: '#222222', metalness: 0.8, roughness: 0.2 }, position: [-10, 0, 0], rotation: [1.57, 0, 0], castShadow: true, animation: { type: 'rotate', axis: 'x', speed: 15 } },
      // Landing skids
      { type: 'mesh', geometry: { type: 'cylinder', args: [0.2, 0.2, 6, 16] }, material: { color: '#444444', metalness: 0.7, roughness: 0.3 }, position: [1, -2, -2], rotation: [0, 0, 1.57], castShadow: true },
      { type: 'mesh', geometry: { type: 'cylinder', args: [0.2, 0.2, 6, 16] }, material: { color: '#444444', metalness: 0.7, roughness: 0.3 }, position: [1, -2, 2], rotation: [0, 0, 1.57], castShadow: true },
    ]
  },

  fan: {
    scale: 0.2,
    components: [
      // Hub
      { type: 'mesh', geometry: { type: 'cylinder', args: [1, 1, 0.5, 32] }, material: { color: '#666666', metalness: 0.8, roughness: 0.2 }, position: [0, 0, 0], castShadow: true },
      // Blades
      { type: 'mesh', geometry: { type: 'box', args: [8, 0.15, 1.5] }, material: { color: '#3b82f6', metalness: 0.7, roughness: 0.3, emissive: '#3b82f6', emissiveIntensity: 0.2 }, position: [0, 0, 0], castShadow: true, animation: { type: 'rotate', axis: 'z', speed: 8 } },
      { type: 'mesh', geometry: { type: 'box', args: [8, 0.15, 1.5] }, material: { color: '#3b82f6', metalness: 0.7, roughness: 0.3, emissive: '#3b82f6', emissiveIntensity: 0.2 }, position: [0, 0, 0], rotation: [0, 0, 1.047], castShadow: true, animation: { type: 'rotate', axis: 'z', speed: 8 } },
      { type: 'mesh', geometry: { type: 'box', args: [8, 0.15, 1.5] }, material: { color: '#3b82f6', metalness: 0.7, roughness: 0.3, emissive: '#3b82f6', emissiveIntensity: 0.2 }, position: [0, 0, 0], rotation: [0, 0, 2.094], castShadow: true, animation: { type: 'rotate', axis: 'z', speed: 8 } },
      // Motor base
      { type: 'mesh', geometry: { type: 'cylinder', args: [1.5, 2, 3, 32] }, material: { color: '#444444', metalness: 0.6, roughness: 0.4 }, position: [0, 0, -2], castShadow: true },
      // Stand
      { type: 'mesh', geometry: { type: 'cylinder', args: [0.3, 0.3, 8, 16] }, material: { color: '#555555', metalness: 0.7, roughness: 0.3 }, position: [0, -6, -2], castShadow: true },
      // Base
      { type: 'mesh', geometry: { type: 'cylinder', args: [3, 3, 0.5, 32] }, material: { color: '#333333', metalness: 0.7, roughness: 0.3 }, position: [0, -10, -2], castShadow: true },
    ]
  },

  'solar panel': {
    scale: 0.2,
    components: [
      // Main panel
      { type: 'mesh', geometry: { type: 'box', args: [12, 0.3, 8] }, material: { color: '#1e3a8a', metalness: 0.5, roughness: 0.3, emissive: '#1e3a8a', emissiveIntensity: 0.2 }, position: [0, 5, 0], castShadow: true },
      // Panel grid lines
      { type: 'mesh', geometry: { type: 'box', args: [12.1, 0.05, 0.1] }, material: { color: '#ffffff', metalness: 0.9, roughness: 0.1 }, position: [0, 5.2, -2.7], castShadow: true },
      { type: 'mesh', geometry: { type: 'box', args: [12.1, 0.05, 0.1] }, material: { color: '#ffffff', metalness: 0.9, roughness: 0.1 }, position: [0, 5.2, 0], castShadow: true },
      { type: 'mesh', geometry: { type: 'box', args: [12.1, 0.05, 0.1] }, material: { color: '#ffffff', metalness: 0.9, roughness: 0.1 }, position: [0, 5.2, 2.7], castShadow: true },
      // Support pole
      { type: 'mesh', geometry: { type: 'cylinder', args: [0.3, 0.3, 10, 16] }, material: { color: '#666666', metalness: 0.7, roughness: 0.3 }, position: [0, -2, 0], castShadow: true },
      // Tilt mechanism
      { type: 'mesh', geometry: { type: 'box', args: [1, 1, 1] }, material: { color: '#555555', metalness: 0.8, roughness: 0.2 }, position: [0, 3, 0], castShadow: true, animation: { type: 'oscillate', axis: 'x', amplitude: 0.3, frequency: 0.5 } },
      // Base platform
      { type: 'mesh', geometry: { type: 'box', args: [4, 0.5, 4] }, material: { color: '#444444', metalness: 0.6, roughness: 0.4 }, position: [0, -7, 0], castShadow: true },
    ]
  },

  pendulum: {
    scale: 0.3,
    components: [
      // Pivot point
      { type: 'mesh', geometry: { type: 'sphere', args: [0.5, 32, 32] }, material: { color: '#888888', metalness: 0.9, roughness: 0.1 }, position: [0, 8, 0], castShadow: true },
      // String/rod
      { type: 'mesh', geometry: { type: 'cylinder', args: [0.1, 0.1, 16, 16] }, material: { color: '#444444', metalness: 0.5, roughness: 0.5 }, position: [0, 0, 0], castShadow: true },
      // Bob
      { type: 'mesh', geometry: { type: 'sphere', args: [2, 32, 32] }, material: { color: '#3b82f6', metalness: 0.8, roughness: 0.2, emissive: '#3b82f6', emissiveIntensity: 0.3 }, position: [0, -8, 0], castShadow: true, animation: { type: 'oscillate', axis: 'x', amplitude: 2, frequency: 1 } },
      // Support frame left
      { type: 'mesh', geometry: { type: 'box', args: [0.5, 10, 0.5] }, material: { color: '#666666', metalness: 0.7, roughness: 0.3 }, position: [-3, 3, 0], rotation: [0, 0, -0.3], castShadow: true },
      // Support frame right
      { type: 'mesh', geometry: { type: 'box', args: [0.5, 10, 0.5] }, material: { color: '#666666', metalness: 0.7, roughness: 0.3 }, position: [3, 3, 0], rotation: [0, 0, 0.3], castShadow: true },
      // Base
      { type: 'mesh', geometry: { type: 'box', args: [8, 0.5, 2] }, material: { color: '#444444', metalness: 0.6, roughness: 0.4 }, position: [0, -2, 0], castShadow: true },
    ]
  },

  'water wheel': {
    scale: 0.18,
    components: [
      // Main wheel rim
      { type: 'mesh', geometry: { type: 'torus', args: [6, 0.5, 16, 100] }, material: { color: '#8B4513', metalness: 0.3, roughness: 0.7 }, position: [0, 0, 0], rotation: [0, 0, 1.57], castShadow: true, animation: { type: 'rotate', axis: 'z', speed: 1.5 } },
      // Paddles (12 around the wheel)
      ...Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return {
          type: 'mesh' as const,
          geometry: { type: 'box', args: [1, 2.5, 0.2] },
          material: { color: '#654321', metalness: 0.2, roughness: 0.8 },
          position: [Math.cos(angle) * 6, Math.sin(angle) * 6, 0] as [number, number, number],
          rotation: [0, 0, angle + 1.57] as [number, number, number],
          castShadow: true,
          animation: { type: 'rotate' as const, axis: 'z' as const, speed: 1.5 }
        };
      }),
      // Axle
      { type: 'mesh', geometry: { type: 'cylinder', args: [0.4, 0.4, 14, 16] }, material: { color: '#333333', metalness: 0.8, roughness: 0.2 }, position: [0, 0, 0], rotation: [0, 0, 1.57], castShadow: true },
      // Support frame left
      { type: 'mesh', geometry: { type: 'box', args: [0.6, 10, 0.6] }, material: { color: '#666666', metalness: 0.7, roughness: 0.3 }, position: [0, -3, -7], castShadow: true },
      // Support frame right
      { type: 'mesh', geometry: { type: 'box', args: [0.6, 10, 0.6] }, material: { color: '#666666', metalness: 0.7, roughness: 0.3 }, position: [0, -3, 7], castShadow: true },
    ]
  },

  gear: {
    scale: 0.25,
    components: [
      // Large gear body
      { type: 'mesh', geometry: { type: 'cylinder', args: [5, 5, 1, 32] }, material: { color: '#3b82f6', metalness: 0.8, roughness: 0.2, emissive: '#3b82f6', emissiveIntensity: 0.2 }, position: [0, 0, 0], castShadow: true, animation: { type: 'rotate', axis: 'z', speed: 2 } },
      // Large gear teeth
      ...Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return {
          type: 'mesh' as const,
          geometry: { type: 'box', args: [0.8, 1.2, 1] },
          material: { color: '#2563eb', metalness: 0.7, roughness: 0.3 },
          position: [Math.cos(angle) * 5.5, Math.sin(angle) * 5.5, 0] as [number, number, number],
          rotation: [0, 0, angle] as [number, number, number],
          castShadow: true,
          animation: { type: 'rotate' as const, axis: 'z' as const, speed: 2 }
        };
      }),
      // Small gear body
      { type: 'mesh', geometry: { type: 'cylinder', args: [3, 3, 1, 32] }, material: { color: '#10b981', metalness: 0.8, roughness: 0.2, emissive: '#10b981', emissiveIntensity: 0.2 }, position: [7, 0, 0], castShadow: true, animation: { type: 'rotate', axis: 'z', speed: -3.3 } },
      // Small gear teeth
      ...Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        return {
          type: 'mesh' as const,
          geometry: { type: 'box', args: [0.6, 1, 1] },
          material: { color: '#059669', metalness: 0.7, roughness: 0.3 },
          position: [7 + Math.cos(angle) * 3.3, Math.sin(angle) * 3.3, 0] as [number, number, number],
          rotation: [0, 0, angle] as [number, number, number],
          castShadow: true,
          animation: { type: 'rotate' as const, axis: 'z' as const, speed: -3.3 }
        };
      }),
      // Base plate
      { type: 'mesh', geometry: { type: 'box', args: [16, 0.5, 8] }, material: { color: '#444444', metalness: 0.6, roughness: 0.4 }, position: [3, -3, 0], castShadow: true },
    ]
  },
};

// Match topic to template
export function getModelTemplate(topic: string): Model3D | null {
  const topicLower = topic.toLowerCase();
  
  // Direct matches
  if (modelTemplates[topicLower]) {
    return modelTemplates[topicLower];
  }
  
  // Fuzzy matching
  for (const [key, template] of Object.entries(modelTemplates)) {
    if (topicLower.includes(key) || key.includes(topicLower)) {
      return template;
    }
  }
  
  return null;
}

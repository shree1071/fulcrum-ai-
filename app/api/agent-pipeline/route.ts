import { NextRequest } from 'next/server';
import { lookupDomain, classifySimType, physicsKB } from '@/lib/physics-kb';
import { getModelTemplate } from '@/lib/model-templates';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MAX_GENERATION_ATTEMPTS = 3;

export const runtime = 'edge';

function createSSE(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS - Adapted from reference repo
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  quality: 'excellent' | 'good' | 'poor' | 'invalid';
}

function validateModel3D(model3D: any, topic: string): ValidationResult {
  const issues: string[] = [];
  const t = topic.toLowerCase();
  
  if (!model3D || !model3D.components || !Array.isArray(model3D.components)) {
    return { isValid: false, issues: ['No model3D.components array found'], quality: 'invalid' };
  }
  
  const components = model3D.components;
  const componentCount = components.length;
  
  // Check minimum component count
  if (componentCount < 8) {
    issues.push(`Only ${componentCount} components - need at least 8 for recognizable object`);
  }
  
  // Check each component structure
  let validComponents = 0;
  let geometryTypes = new Set<string>();
  
  components.forEach((comp: any, idx: number) => {
    if (!comp.geometry || !comp.geometry.type) {
      issues.push(`Component ${idx}: missing geometry.type`);
      return;
    }
    
    if (comp.type && comp.type !== 'mesh') {
      issues.push(`Component ${idx}: type should be "mesh", got "${comp.type}"`);
    }
    
    const geoType = comp.geometry.type.toLowerCase();
    geometryTypes.add(geoType);
    
    // Validate geometry args exist
    if (!comp.geometry.args || !Array.isArray(comp.geometry.args)) {
      issues.push(`Component ${idx}: geometry.args must be an array`);
      return;
    }
    
    // Validate material
    if (!comp.material || !comp.material.color) {
      issues.push(`Component ${idx}: missing material.color`);
    }
    
    validComponents++;
  });
  
  // Check geometry variety
  if (geometryTypes.size < 2) {
    issues.push(`Only using ${geometryTypes.size} geometry type(s) - use at least 2-3 different types`);
  }
  
  // Topic-specific spatial checks
  if (/\b(bicycle|bike|wheel|car|vehicle)\b/.test(t)) {
    const hasVerticalWheels = components.some((c: any) => {
      const rot = c.rotation || [0, 0, 0];
      return (c.geometry?.type === 'torus' || c.geometry?.type === 'cylinder') && 
             Math.abs(rot[0] - Math.PI/2) < 0.1;
    });
    if (!hasVerticalWheels) {
      issues.push('SPATIAL: Wheels must be vertical (rotation [Math.PI/2, 0, 0])');
    }
  }
  
  if (/\b(gear|gears|cog)\b/.test(t)) {
    const hasMultipleGearParts = componentCount >= 12;
    if (!hasMultipleGearParts) {
      issues.push('SPATIAL: Gears need teeth - should have 12+ components for gear teeth');
    }
  }
  
  // Determine quality
  let quality: 'excellent' | 'good' | 'poor' | 'invalid';
  if (issues.length === 0 && componentCount >= 12 && geometryTypes.size >= 3) {
    quality = 'excellent';
  } else if (issues.length <= 2 && componentCount >= 8) {
    quality = 'good';
  } else if (validComponents >= 5) {
    quality = 'poor';
  } else {
    quality = 'invalid';
  }
  
  return {
    isValid: quality !== 'invalid',
    issues,
    quality
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REFERENCE EXAMPLES - Show AI what quality looks like
// ═══════════════════════════════════════════════════════════════════════════

const REFERENCE_EXAMPLES = `
═══ REFERENCE EXAMPLES (match this quality) ═══

EXAMPLE 1: Helicopter
{
  "components": [
    {"type": "mesh", "geometry": {"type": "sphere", "args": [1.2, 32, 32]}, "material": {"color": "#1e40af", "metalness": 0.7, "roughness": 0.3}, "position": [0, 0, 0], "rotation": [0, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.8, 1.0, 2.5, 32]}, "material": {"color": "#1e40af", "metalness": 0.6, "roughness": 0.4}, "position": [0, -1.5, 0], "rotation": [0, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "box", "args": [8, 0.3, 0.6]}, "material": {"color": "#374151", "metalness": 0.8, "roughness": 0.2}, "position": [0, 1.5, 0], "rotation": [0, 0, 0], "castShadow": true, "animation": {"type": "rotate", "axis": "y", "speed": 8}},
    {"type": "mesh", "geometry": {"type": "box", "args": [0.5, 0.15, 2.2]}, "material": {"color": "#374151", "metalness": 0.8, "roughness": 0.2}, "position": [0, 1.5, 0], "rotation": [0, 0, 0], "castShadow": true, "animation": {"type": "rotate", "axis": "y", "speed": 8}},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.15, 0.15, 1.8, 16]}, "material": {"color": "#6b7280", "metalness": 0.9, "roughness": 0.1}, "position": [0, 0.5, 0], "rotation": [0, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "box", "args": [0.4, 0.3, 3.5]}, "material": {"color": "#1e40af", "metalness": 0.5, "roughness": 0.5}, "position": [0, -2.5, 1.8], "rotation": [0.3, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.25, 0.25, 0.8, 16]}, "material": {"color": "#374151", "metalness": 0.7, "roughness": 0.3}, "position": [0, -3.2, 0.5], "rotation": [0, 0, 1.57], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.25, 0.25, 0.8, 16]}, "material": {"color": "#374151", "metalness": 0.7, "roughness": 0.3}, "position": [0, -3.2, -0.5], "rotation": [0, 0, 1.57], "castShadow": true}
  ],
  "scale": 0.3
}

EXAMPLE 2: Bicycle (note vertical wheels!)
{
  "components": [
    {"type": "mesh", "geometry": {"type": "torus", "args": [1.2, 0.15, 16, 100]}, "material": {"color": "#111827", "metalness": 0.3, "roughness": 0.9}, "position": [2, 0, 0], "rotation": [1.57, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "torus", "args": [1.2, 0.15, 16, 100]}, "material": {"color": "#111827", "metalness": 0.3, "roughness": 0.9}, "position": [-2, 0, 0], "rotation": [1.57, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.05, 0.05, 4.5, 16]}, "material": {"color": "#dc2626", "metalness": 0.7, "roughness": 0.3}, "position": [0, 0.8, 0], "rotation": [0, 0, 1.57], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.05, 0.05, 2.5, 16]}, "material": {"color": "#dc2626", "metalness": 0.7, "roughness": 0.3}, "position": [1, 0, 0], "rotation": [0, 0, 0.8], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.05, 0.05, 2.5, 16]}, "material": {"color": "#dc2626", "metalness": 0.7, "roughness": 0.3}, "position": [-0.8, 0, 0], "rotation": [0, 0, -0.6], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.08, 0.08, 1.2, 16]}, "material": {"color": "#374151", "metalness": 0.8, "roughness": 0.2}, "position": [0, 1.5, 0], "rotation": [0, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.12, 0.12, 0.4, 16]}, "material": {"color": "#1f2937", "metalness": 0.5, "roughness": 0.7}, "position": [0, 1.2, 0], "rotation": [0, 0, 0], "castShadow": true}
  ],
  "scale": 0.4
}

EXAMPLE 3: Wind Turbine
{
  "components": [
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.8, 1.2, 12, 32]}, "material": {"color": "#e5e7eb", "metalness": 0.6, "roughness": 0.4}, "position": [0, -6, 0], "rotation": [0, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "sphere", "args": [1.0, 32, 32]}, "material": {"color": "#f3f4f6", "metalness": 0.7, "roughness": 0.3}, "position": [0, 0, 0], "rotation": [0, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "box", "args": [0.4, 6, 1.2]}, "material": {"color": "#ffffff", "metalness": 0.5, "roughness": 0.3}, "position": [0, 3.5, 0], "rotation": [0, 0, 0], "castShadow": true, "animation": {"type": "rotate", "axis": "z", "speed": 2}},
    {"type": "mesh", "geometry": {"type": "box", "args": [0.4, 6, 1.2]}, "material": {"color": "#ffffff", "metalness": 0.5, "roughness": 0.3}, "position": [0, 3.5, 0], "rotation": [0, 0, 2.09], "castShadow": true, "animation": {"type": "rotate", "axis": "z", "speed": 2}},
    {"type": "mesh", "geometry": {"type": "box", "args": [0.4, 6, 1.2]}, "material": {"color": "#ffffff", "metalness": 0.5, "roughness": 0.3}, "position": [0, 3.5, 0], "rotation": [0, 0, 4.19], "castShadow": true, "animation": {"type": "rotate", "axis": "z", "speed": 2}}
  ],
  "scale": 0.25
}

KEY PATTERNS:
- Helicopters: body sphere + tail cylinder + rotating blade group (4+ blade meshes)
- Bicycles: TWO vertical wheels (rotation [1.57,0,0]) + frame tubes connecting them
- Wind turbines: tall tower + nacelle sphere + 3 rotating blades
- Each example has 5-8+ components with varied geometry types
- Animations on parts that move in real life
- Realistic colors and materials (metalness 0.3-0.9, roughness 0.2-0.9)
═══ END REFERENCE EXAMPLES ═══
`;

async function streamGroqResponse(
  topic: string, 
  researchBrief: string, 
  simType: string,
  attempt: number = 1,
  previousIssues: string[] = []
) {
  const customSimPrompt = simType === "custom" 
    ? `\n\n🎨 CRITICAL: CREATE A COMPLETELY UNIQUE 3D MODEL FOR "${topic}"

You are a senior 3D graphics engineer. Your job is to create a CUSTOM, physics-accurate 3D model.

${attempt > 1 ? `⚠️ ATTEMPT ${attempt}/${MAX_GENERATION_ATTEMPTS} - Previous attempt had issues:\n${previousIssues.map(i => `  - ${i}`).join('\n')}\n\nFIX THESE ISSUES in this generation!\n` : ''}

${REFERENCE_EXAMPLES}

⚠️ IMPORTANT JSON STRUCTURE - Follow this EXACTLY:

{
  "components": [
    {
      "type": "mesh",
      "geometry": { "type": "sphere", "args": [2, 32, 32] },
      "material": { "color": "#3b82f6", "metalness": 0.8, "roughness": 0.2 },
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "castShadow": true,
      "animation": { "type": "rotate", "axis": "y", "speed": 2 }
    }
  ],
  "scale": 0.3
}

CRITICAL RULES:
1. EVERY component MUST have "type": "mesh"
2. The geometry type goes in "geometry": { "type": "...", "args": [...] }
3. DO NOT put geometry type as component type!

WRONG ❌:
{"type": "sphere", "geometry": {"radius": 2}}

CORRECT ✅:
{"type": "mesh", "geometry": {"type": "sphere", "args": [2, 32, 32]}}

AVAILABLE GEOMETRIES:
- sphere: { "type": "sphere", "args": [radius, widthSegments, heightSegments] }
  Examples: [0.5,32,32], [3,32,32], [1.5,16,16]
  Use for: heads, balls, joints, hubs, rounded parts
  
- box: { "type": "box", "args": [width, height, depth] }
  Examples: [10,0.2,2], [3,5,3], [8,1,6], [0.5,4,0.5]
  Use for: bodies, frames, beams, panels, blades
  
- cylinder: { "type": "cylinder", "args": [radiusTop, radiusBottom, height, segments] }
  Examples: [2,2,8,32], [1,0.5,3,32], [0.2,0.2,10,16], [4,4,1,32]
  Use for: shafts, poles, tubes, handles, legs, towers
  
- cone: { "type": "cone", "args": [radius, height, segments] }
  Examples: [2,5,32], [1,3,16], [3,8,32]
  Use for: nose cones, tips, tapered parts
  
- torus: { "type": "torus", "args": [radius, tube, radialSegments, tubularSegments] }
  Examples: [3,0.5,16,100], [1,0.2,12,50], [2,0.8,20,80]
  Use for: wheels (MUST rotate [Math.PI/2,0,0] for vertical), rings, donuts

⚠️ ONLY USE THESE 5 GEOMETRY TYPES!

COORDINATE SYSTEM (Three.js):
- Y is UP (ground at y=0)
- Objects stand on ground with bottom near y=0, extending upward (+Y)
- Wheels/tires: MUST use rotation [1.57, 0, 0] (Math.PI/2) to stand vertical
- Connected parts: position relative to each other, not scattered randomly

MATERIAL PROPERTIES:
{
  "color": "#3b82f6" | "#ef4444" | "#10b981" | "#f59e0b" | "#666666",
  "metalness": 0.1-0.95,
  "roughness": 0.1-0.9,
  "emissive": "#hexcode",
  "emissiveIntensity": 0.1-0.8
}

ANIMATIONS:
- { "type": "rotate", "axis": "x"|"y"|"z", "speed": 0.5-15 }
- { "type": "oscillate", "axis": "x"|"y"|"z", "amplitude": 0.3-3, "frequency": 0.5-4 }
- { "type": "orbit", "radius": 1-8, "speed": 0.3-3 }

DESIGN PROCESS FOR "${topic}":
1. Research: What does "${topic}" actually look like? What are its main parts?
2. Decompose: Break it into 8-15 geometric primitives
3. Proportions: Use realistic size ratios between parts
4. Positioning: Build hierarchically - connect parts logically in 3D space
5. Materials: Choose colors/metalness/roughness that match real materials
6. Animation: Animate parts that move in real life

QUALITY CHECKLIST:
✓ At least 8 components (12+ is better)
✓ At least 3 different geometry types
✓ Realistic proportions and positioning
✓ If it has wheels: rotation [1.57, 0, 0] for vertical orientation
✓ If it has rotating parts: add animation
✓ Varied colors and materials
✓ Components form a connected, recognizable object

CREATE 8-15 COMPONENTS - make "${topic}" instantly recognizable!

WRONG EXAMPLE (too simple, only 2 parts):
{
  "components": [
    {"type": "mesh", "geometry": {"type": "sphere", "args": [2,32,32]}, "material": {"color": "#3b82f6"}, "position": [0,0,0]}
  ]
}

CORRECT EXAMPLE for "drone":
{
  "components": [
    {"type": "mesh", "geometry": {"type": "box", "args": [3, 0.3, 3]}, "material": {"color": "#1f2937", "metalness": 0.8, "roughness": 0.2}, "position": [0, 0, 0], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.15, 0.15, 1.5, 16]}, "material": {"color": "#374151", "metalness": 0.7, "roughness": 0.3}, "position": [1.5, 0.8, 1.5], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.15, 0.15, 1.5, 16]}, "material": {"color": "#374151", "metalness": 0.7, "roughness": 0.3}, "position": [-1.5, 0.8, 1.5], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.15, 0.15, 1.5, 16]}, "material": {"color": "#374151", "metalness": 0.7, "roughness": 0.3}, "position": [1.5, 0.8, -1.5], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.15, 0.15, 1.5, 16]}, "material": {"color": "#374151", "metalness": 0.7, "roughness": 0.3}, "position": [-1.5, 0.8, -1.5], "castShadow": true},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.8, 0.8, 0.2, 32]}, "material": {"color": "#ef4444", "metalness": 0.6, "roughness": 0.4}, "position": [1.5, 1.6, 1.5], "castShadow": true, "animation": {"type": "rotate", "axis": "y", "speed": 15}},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.8, 0.8, 0.2, 32]}, "material": {"color": "#ef4444", "metalness": 0.6, "roughness": 0.4}, "position": [-1.5, 1.6, 1.5], "castShadow": true, "animation": {"type": "rotate", "axis": "y", "speed": 15}},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.8, 0.8, 0.2, 32]}, "material": {"color": "#3b82f6", "metalness": 0.6, "roughness": 0.4}, "position": [1.5, 1.6, -1.5], "castShadow": true, "animation": {"type": "rotate", "axis": "y", "speed": 15}},
    {"type": "mesh", "geometry": {"type": "cylinder", "args": [0.8, 0.8, 0.2, 32]}, "material": {"color": "#3b82f6", "metalness": 0.6, "roughness": 0.4}, "position": [-1.5, 1.6, -1.5], "castShadow": true, "animation": {"type": "rotate", "axis": "y", "speed": 15}},
    {"type": "mesh", "geometry": {"type": "sphere", "args": [0.4, 32, 32]}, "material": {"color": "#111827", "metalness": 0.9, "roughness": 0.1}, "position": [0, -0.3, 0], "castShadow": true}
  ],
  "scale": 0.3
}

NOW CREATE "${topic}" - make it detailed and recognizable!
`
    : '';

  const systemPrompt = `You are a creative physics education AI and expert 3D modeler. Given a topic and research brief, generate:

1. Structured markdown notes with:
- First principles explanation (Feynman style)
- Key equations with variable definitions
- Real-world intuition and examples
- Parameter table showing current values

2. A SIMCONFIG block in this exact format:
\`\`\`simconfig
{ "simType": "...", "parameters": {...}, "thresholds": {...}, "failureExplanation": "...", "model3D": {...} }
\`\`\`

CRITICAL RULES:
- simType must be one of: wind_turbine, newton_cradle, rocket, projectile, spring_mass, orbital, bridge, water_bottle, robotic_arm, custom
- Parameter names must match exactly for the simType (provided in research brief)
- Thresholds must be strictly above the default parameter values
- failureExplanation must cite real physics equations and numbers
- For custom simType, you MUST include "model3D" field with UNIQUE 3D model
- NEVER repeat the same model structure - each topic needs DIFFERENT components, sizes, and arrangements
- DO NOT use generic fan/ceiling fan structure for non-fan topics
- Never explain your reasoning. Just output notes then SIMCONFIG.

Research brief: ${researchBrief}${customSimPrompt}
Topic: ${topic}

IMPORTANT: If this is a custom topic, the model3D MUST be specifically designed for "${topic}" - not a generic model!`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate physics notes and simulation config for: ${topic}

CRITICAL: If this is a custom topic, create a UNIQUE 3D model specifically for "${topic}". 
DO NOT reuse previous model structures. Each topic needs its own custom design with different:
- Component counts (vary between 8-20)
- Geometry types (mix spheres, boxes, cylinders, cones, torus)
- Sizes (use different dimensions for each part)
- Positions (spread components in 3D space)
- Colors (choose appropriate for the topic)
- Animations (match the physics of the topic)

Make "${topic}" look completely different from any other topic!` }
      ],
      stream: true,
      temperature: 0.9,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  return response;
}

function parseSimConfig(text: string): any {
  const simconfigMatch = text.match(/```simconfig\s*([\s\S]*?)```/);
  if (simconfigMatch) {
    try {
      return JSON.parse(simconfigMatch[1].trim());
    } catch (e) {
      console.error('Failed to parse simconfig:', e);
    }
  }
  return null;
}

function validateSimConfig(config: any, simType: string): { violations: any[], status: string } {
  const violations = [];
  
  if (!config) {
    violations.push({ message: "No SIMCONFIG block found" });
    return { violations, status: "CRITICAL_FAILURE" };
  }
  
  if (!config.simType) {
    violations.push({ message: "Missing simType field" });
  }
  
  if (!config.parameters || typeof config.parameters !== 'object') {
    violations.push({ message: "Missing or invalid parameters object" });
  }
  
  if (!config.thresholds || typeof config.thresholds !== 'object') {
    violations.push({ message: "Missing or invalid thresholds object" });
  }
  
  // Check if simType matches expected
  if (simType !== "custom" && config.simType !== simType) {
    violations.push({ message: `simType mismatch: expected ${simType}, got ${config.simType}` });
  }
  
  // Validate thresholds are above parameter values
  if (config.parameters && config.thresholds) {
    for (const [param, value] of Object.entries(config.parameters)) {
      const threshold = config.thresholds[param];
      if (threshold) {
        if (typeof value === 'number' && threshold.warning && value >= threshold.warning) {
          violations.push({ message: `Parameter ${param} default value ${value} is not below warning threshold ${threshold.warning}` });
        }
      }
    }
  }
  
  const status = violations.length === 0 ? "OPTIMAL" : "WARNING";
  return { violations, status };
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { topic, qualityMode = "fast", journalId } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Agent 1: Research
        controller.enqueue(encoder.encode(createSSE({
          type: "agent_status",
          agent: "research",
          status: "running"
        })));

        const kbEntry = lookupDomain(topic);
        const simType = classifySimType(topic);
        
        // Check for pre-built template first
        if (simType === "custom") {
          const template = getModelTemplate(topic);
          if (template) {
            controller.enqueue(encoder.encode(createSSE({
              type: "agent_status",
              agent: "research",
              status: "complete",
              data: { simType, usingTemplate: true, templateName: template.name }
            })));
            
            // Return template-based config immediately
            const templateConfig = {
              simType: "custom",
              parameters: {},
              thresholds: {},
              failureExplanation: `Using pre-built template for ${topic}`,
              model3D: template.model3D
            };
            
            controller.enqueue(encoder.encode(createSSE({
              type: "simconfig",
              data: templateConfig
            })));
            
            controller.enqueue(encoder.encode(createSSE({ type: "done" })));
            controller.close();
            return;
          }
        }
        
        const researchBrief = kbEntry 
          ? `Domain: ${simType}\nEquations: ${kbEntry.equations.join(', ')}\nDefault parameters: ${JSON.stringify(kbEntry.defaults)}\nParameter names: ${kbEntry.parameterNames.join(', ')}\nThresholds: ${JSON.stringify(kbEntry.thresholds)}\nSources: ${kbEntry.sources.join(', ')}`
          : `Domain: custom\nNo specific knowledge base entry found. Generate appropriate physics content for: ${topic}`;

        controller.enqueue(encoder.encode(createSSE({
          type: "agent_status",
          agent: "research",
          status: "complete",
          data: { simType, researchBrief }
        })));

        // Agent 2: Design (with multi-turn validation for custom models)
        let fullText = "";
        let simConfig: any = null;
        let bestConfig: any = null;
        let bestQuality: string = 'invalid';
        
        if (!GROQ_API_KEY) {
          throw new Error("GROQ_API_KEY not configured");
        }

        // For custom topics, try R3F code generation first
        if (simType === "custom") {
          try {
            controller.enqueue(encoder.encode(createSSE({
              type: "agent_status",
              agent: "design",
              status: "running",
              mode: "r3f_generation"
            })));
            
            const r3fResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-scene`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topic, params: kbEntry?.defaults || {} })
            });
            
            if (r3fResponse.ok) {
              const r3fData = await r3fResponse.json();
              if (r3fData.success && r3fData.code) {
                // Use R3F code
                simConfig = {
                  simType: "custom",
                  parameters: kbEntry?.defaults || {},
                  thresholds: {},
                  failureExplanation: `Custom 3D model for ${topic}`,
                  r3fCode: r3fData.code
                };
                
                controller.enqueue(encoder.encode(createSSE({
                  type: "simconfig",
                  data: simConfig
                })));
                
                controller.enqueue(encoder.encode(createSSE({
                  type: "agent_status",
                  agent: "design",
                  status: "complete",
                  mode: "r3f_generation"
                })));
                
                // Skip to validation
                bestConfig = simConfig;
              }
            }
          } catch (r3fError) {
            console.error('[agent-pipeline] R3F generation failed, falling back to JSON:', r3fError);
          }
        }
        
        // If R3F generation didn't work, use JSON-based generation
        if (!bestConfig) {
        // If R3F generation didn't work, use JSON-based generation
        if (!bestConfig) {
          for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
          controller.enqueue(encoder.encode(createSSE({
            type: "agent_status",
            agent: "design",
            status: "running",
            attempt,
            maxAttempts: MAX_GENERATION_ATTEMPTS
          })));

          fullText = "";
          const previousIssues = attempt > 1 && simConfig?.model3D 
            ? validateModel3D(simConfig.model3D, topic).issues 
            : [];

          const apiResponse = await streamGroqResponse(topic, researchBrief, simType, attempt, previousIssues);
          const reader = apiResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    
                    if (content) {
                      fullText += content;
                      if (attempt === 1) {
                        controller.enqueue(encoder.encode(createSSE({
                          type: "token",
                          content
                        })));
                      }
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          controller.enqueue(encoder.encode(createSSE({
            type: "agent_status",
            agent: "design",
            status: "complete",
            attempt
          })));

          // Parse and validate
          simConfig = parseSimConfig(fullText);
          
          if (simConfig && simType === "custom" && simConfig.model3D) {
            const validation = validateModel3D(simConfig.model3D, topic);
            
            controller.enqueue(encoder.encode(createSSE({
              type: "validation",
              attempt,
              quality: validation.quality,
              issues: validation.issues,
              componentCount: simConfig.model3D.components?.length || 0
            })));
            
            // Track best result
            const qualityRank = { excellent: 4, good: 3, poor: 2, invalid: 1 };
            if (qualityRank[validation.quality] > qualityRank[bestQuality]) {
              bestQuality = validation.quality;
              bestConfig = simConfig;
            }
            
            // Stop if we got excellent quality
            if (validation.quality === 'excellent') {
              break;
            }
          } else {
            // Non-custom or no model3D - use first result
            bestConfig = simConfig;
            break;
          }
        }
        }
        
        // Use best config
        simConfig = bestConfig;
        
        if (simConfig) {
          controller.enqueue(encoder.encode(createSSE({
            type: "simconfig",
            data: simConfig
          })));
        }

        // Agent 3: Validator
        controller.enqueue(encoder.encode(createSSE({
          type: "agent_status",
          agent: "validate",
          status: "running"
        })));

        const validation = validateSimConfig(simConfig, simType);

        controller.enqueue(encoder.encode(createSSE({
          type: "validation",
          violations: validation.violations,
          status: validation.status
        })));

        controller.enqueue(encoder.encode(createSSE({
          type: "agent_status",
          agent: "validate",
          status: "complete"
        })));

        controller.enqueue(encoder.encode(createSSE({ type: "done" })));
        controller.close();

      } catch (error: any) {
        controller.enqueue(encoder.encode(createSSE({
          type: "error",
          message: error.message
        })));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

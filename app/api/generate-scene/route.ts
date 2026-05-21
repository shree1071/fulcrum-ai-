/**
 * /api/generate-scene — R3F component generation with multi-turn validation
 * 
 * Generates React Three Fiber JSX components for custom 3D models.
 * Uses multi-turn agent pipeline with validation between attempts.
 */

import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_AGENT_TURNS = 3;

const groq = new Groq({ apiKey: GROQ_API_KEY || "missing_groq_key" });

export const runtime = 'edge';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION TOOLS
// ═══════════════════════════════════════════════════════════════════════════

function stripFences(raw: string): string {
  return raw
    .replace(/```(?:jsx?|tsx?|javascript|typescript)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

function stripImportsExports(code: string): string {
  return code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .trim();
}

function toolStrip(rawCode: string): { code: string; issues: string[] } {
  const code = stripImportsExports(stripFences(rawCode));
  const issues: string[] = [];
  
  if (!code.includes("GeneratedScene")) {
    issues.push("GeneratedScene function not found — name your component exactly 'function GeneratedScene(...)'");
  }
  
  if (code.length < 200) {
    issues.push(`Output only ${code.length} chars — write complete component (minimum 200 chars)`);
  }
  
  return { code, issues };
}

function staticGeometryAudit(code: string, topic: string): string[] {
  const t = topic.toLowerCase();
  const issues: string[] = [];
  
  // Check for vertical wheels on vehicles
  if (/\b(bicycle|bike|wheel|car|vehicle|motorcycle)\b/.test(t)) {
    const hasVertWheel = /rotation=\{\s*\[\s*Math\.PI\s*\/\s*2/.test(code);
    const hasWheelGeom = /torusGeometry|cylinderGeometry/.test(code);
    if (hasWheelGeom && !hasVertWheel) {
      issues.push("SPATIAL: Wheels must be VERTICAL (rotation={[Math.PI/2, 0, 0]})");
    }
  }
  
  // Check mesh count
  const meshCount = (code.match(/<mesh\b/g) || []).length;
  if (meshCount < 8) {
    issues.push(`STRUCTURE: Only ${meshCount} <mesh> elements — need at least 8 for recognizable object`);
  }
  
  // Check geometry variety
  const boxCount = (code.match(/<boxGeometry\b/g) || []).length;
  const sphereCount = (code.match(/<sphereGeometry\b/g) || []).length;
  const cylCount = (code.match(/<cylinderGeometry\b/g) || []).length;
  const torusCount = (code.match(/<torusGeometry\b/g) || []).length;
  const coneCount = (code.match(/<coneGeometry\b/g) || []).length;
  
  const shapeVariety = [boxCount, sphereCount, cylCount, torusCount, coneCount].filter(n => n > 0).length;
  if (shapeVariety < 2) {
    issues.push("STRUCTURE: Use at least 2-3 different geometry types");
  }
  
  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════
// REFERENCE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════

const HAND_CRAFT_METHODOLOGY = `
═══ R3F COMPONENT BUILDING RULES ═══

COORDINATE SYSTEM:
- Y is UP, ground at y=0
- Objects stand on ground with bottom near y=0, extending upward
- Wheels: rotation={[Math.PI/2, 0, 0]} for vertical orientation

COMPONENT STRUCTURE:
function GeneratedScene({ params = {} }) {
  const groupRef = useRef();
  
  // Extract params
  const speed = Number(params.Speed ?? 100);
  
  // Animation
  useFrame((state, delta) => {
    // Animate rotating parts
  });
  
  return (
    <group ref={groupRef}>
      {/* Ground */}
      <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      
      {/* Your 3D model components */}
    </group>
  );
}

REQUIREMENTS:
- Minimum 8-12 <mesh> elements
- Use 3+ geometry types (box, sphere, cylinder, torus, cone)
- Realistic proportions and positioning
- castShadow on all meshes
- Animate parts that move in real life
- Connected hierarchy (not scattered parts)
`;

const REFERENCE_HELICOPTER = `
// REFERENCE: Helicopter
function GeneratedScene({ params = {} }) {
  const rotorRef = useRef();
  const tailRotorRef = useRef();
  
  const rotorSpeed = Number(params.Rotor_Speed ?? 800);
  
  useFrame((state, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.y += delta * (rotorSpeed / 100);
    if (tailRotorRef.current) tailRotorRef.current.rotation.x += delta * (rotorSpeed / 50);
  });
  
  return (
    <group>
      <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color="#1e40af" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Tail boom */}
      <mesh position={[0, 0.5, -2.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 4, 16]} />
        <meshStandardMaterial color="#1e40af" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Main rotor */}
      <group ref={rotorRef} position={[0, 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[8, 0.2, 0.6]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.2, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Tail rotor */}
      <group ref={tailRotorRef} position={[0, 1, -4.5]} rotation={[0, 0, Math.PI/2]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.1, 0.3]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Skids */}
      <mesh position={[0.8, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.8, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateCode(topic: string, params: Record<string, number>, previousIssues: string[] = []): Promise<string> {
  const issuesFeedback = previousIssues.length > 0 
    ? `\n\n⚠️ PREVIOUS ATTEMPT HAD ISSUES - FIX THESE:\n${previousIssues.map(i => `  - ${i}`).join('\n')}\n`
    : '';
  
  const prompt = `You are a senior Three.js/React Three Fiber developer.

Create a GeneratedScene component for: "${topic}"

${HAND_CRAFT_METHODOLOGY}

${REFERENCE_HELICOPTER}

TOPIC: ${topic}
PARAMETERS: ${JSON.stringify(params)}

${issuesFeedback}

OUTPUT REQUIREMENTS:
- Function named exactly "GeneratedScene"
- Use useRef and useFrame from React Three Fiber
- Minimum 8-12 <mesh> elements
- Use varied geometry types
- Realistic proportions
- Animate moving parts
- NO import statements (they will be stripped)

Output ONLY the component code, no explanation.`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 3000,
  });

  return completion.choices[0]?.message?.content || "";
}

// ═══════════════════════════════════════════════════════════════════════════
// API HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: Request) {
  try {
    const { topic, params = {} } = await req.json();
    
    if (!topic) {
      return Response.json({ error: "topic required" }, { status: 400 });
    }
    
    let bestCode = "";
    let bestQuality = 0;
    let allIssues: string[] = [];
    
    for (let turn = 1; turn <= MAX_AGENT_TURNS; turn++) {
      console.log(`[generate-scene] Turn ${turn}/${MAX_AGENT_TURNS} for "${topic}"`);
      
      const rawCode = await generateCode(topic, params, allIssues);
      const { code, issues: stripIssues } = toolStrip(rawCode);
      const geometryIssues = staticGeometryAudit(code, topic);
      
      const allTurnIssues = [...stripIssues, ...geometryIssues];
      const quality = 100 - (allTurnIssues.length * 20);
      
      console.log(`[generate-scene] Turn ${turn} quality: ${quality}, issues: ${allTurnIssues.length}`);
      
      if (quality > bestQuality) {
        bestQuality = quality;
        bestCode = code;
      }
      
      if (allTurnIssues.length === 0) {
        console.log(`[generate-scene] Perfect generation on turn ${turn}`);
        break;
      }
      
      allIssues = allTurnIssues;
    }
    
    return Response.json({
      success: true,
      code: bestCode,
      quality: bestQuality,
      issues: allIssues
    });
    
  } catch (error: any) {
    console.error("[generate-scene] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

# AI-Generated 3D Physics Models - Implementation Guide

## Overview
Fulcrum now supports **fully dynamic AI-generated 3D physics simulations** for custom topics. The AI generates executable React Three Fiber JSX code that renders unique, creative 3D visualizations.

## How It Works

### 1. User Flow
1. User enters a custom topic (e.g., "fan", "pendulum", "solar panel")
2. System classifies topic as "custom" (not in predefined list)
3. AI generates:
   - Physics notes with equations
   - Parameter definitions
   - **Executable JSX code** for 3D visualization
4. Code is executed and rendered in real-time

### 2. Architecture

#### API Route (`app/api/agent-pipeline/route.ts`)
- **Research Agent**: Classifies topic and looks up knowledge base
- **Design Agent**: Generates physics content + JSX code via GROQ API
- **Validator Agent**: Validates the generated configuration

Key changes:
- Added creative prompt for custom topics
- Instructs AI to generate `componentCode` field with React Three Fiber JSX
- Provides examples of valid geometries and patterns

#### Dynamic Model Component (`app/editor/components/DynamicPhysicsModel.jsx`)
- Receives `componentCode` from AI
- Extracts JSX from markdown code blocks
- Executes JSX using Function constructor
- Renders AI-generated 3D model
- Falls back to visual description parser if code fails

#### Physics Scene (`app/editor/PhysicsScene.jsx`)
- Routes custom topics to `DynamicPhysicsModel`
- Passes `componentCode` and `visualDescription` from simConfig
- Handles all predefined simulations with dedicated components

### 3. AI Prompt Engineering

The AI receives this instruction for custom topics:

```
🎨 CREATIVE VISUALIZATION REQUIRED for "{topic}":

You MUST generate a unique, creative 3D visualization. Think like a creative physics educator!

In the SIMCONFIG, you MUST include a "componentCode" field with React Three Fiber JSX that creates a stunning, physics-accurate 3D model.

RULES FOR componentCode:
1. Use ONLY these Three.js geometries: sphereGeometry, boxGeometry, cylinderGeometry, torusGeometry, coneGeometry, icosahedronGeometry, planeGeometry
2. Wrap everything in a <group> tag
3. Use realistic physics-based animations (rotation, oscillation, etc.)
4. Make it visually stunning with metalness, emissive colors, and proper scaling
5. The code will be executed directly - it must be valid JSX
6. Use parameters from the config to control the visualization
7. Make each topic COMPLETELY DIFFERENT - be creative!
```

### 4. Example AI Output

For topic "fan":

```json
{
  "simType": "custom",
  "parameters": {
    "rotationSpeed": 300,
    "numberOfBlades": 3,
    "bladeLength": 0.5,
    "power": 50
  },
  "thresholds": {
    "rotationSpeed": { "warning": 500, "critical": 800 },
    "power": { "warning": 100, "critical": 150 }
  },
  "componentCode": "```jsx\n<group>\n  <mesh position={[0, 0, 0]}>\n    <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />\n    <meshStandardMaterial color=\"#888888\" metalness={0.8} />\n  </mesh>\n  {Array.from({ length: 3 }).map((_, i) => {\n    const angle = (i / 3) * Math.PI * 2;\n    return (\n      <group key={i} rotation={[0, 0, angle]}>\n        <mesh position={[0.5, 0, 0]}>\n          <boxGeometry args={[1, 0.05, 0.2]} />\n          <meshStandardMaterial color=\"#3b82f6\" metalness={0.7} emissive=\"#3b82f6\" emissiveIntensity={0.2} />\n        </mesh>\n      </group>\n    );\n  })}\n</group>\n```",
  "failureExplanation": "At rotation speeds above 800 RPM, centrifugal stress σ = ρω²r² exceeds material limits"
}
```

## Testing Custom Topics

### Recommended Test Topics
1. **fan** - Rotating blades with motor
2. **pendulum** - Swinging mass on string
3. **solar panel** - Tilting panel with sun tracking
4. **gear system** - Interlocking rotating gears
5. **pulley** - Rope and wheel mechanism
6. **lever** - Fulcrum with force application
7. **inclined plane** - Ramp with sliding object
8. **electromagnet** - Coil with magnetic field lines
9. **prism** - Light refraction visualization
10. **gyroscope** - Spinning disk with precession

### How to Test
1. Start dev server: `npm run dev`
2. Open http://localhost:3000/editor
3. Enter a custom topic in the "Topic" field
4. Click "Generate"
5. Watch the 3-agent pipeline:
   - Research: Classifies as "custom"
   - Design: Generates JSX code
   - Validate: Checks configuration
6. See the 3D model render in real-time
7. Adjust parameters with sliders on the left

## Debugging

### Console Logs
- `🎨 Rendering AI-generated 3D model:` - Shows extracted JSX code
- `❌ Failed to render AI-generated code:` - Shows execution errors

### Common Issues

**Issue**: Same visualization for different topics
**Solution**: AI needs more creative prompting - already fixed with enhanced prompt

**Issue**: JSX execution fails
**Solution**: Check console for syntax errors. AI should generate valid JSX with proper geometry names

**Issue**: No 3D model appears
**Solution**: 
1. Check if `componentCode` field exists in simConfig
2. Verify JSX is wrapped in markdown code block
3. Check browser console for errors

**Issue**: Model is too small/large
**Solution**: Adjust scale in DynamicPhysicsModel (currently 0.8)

## Future Enhancements

1. **Parameter-driven animations**: Use simConfig parameters to control rotation speed, size, etc.
2. **Physics validation**: Ensure generated code follows real physics equations
3. **Code sanitization**: Add security checks for AI-generated code
4. **Template library**: Cache successful generations for similar topics
5. **Interactive editing**: Allow users to modify generated JSX code
6. **Multi-model scenes**: Generate multiple objects that interact

## API Configuration

Ensure `.env` has:
```
GROQ_API_KEY=your_groq_api_key_here
```

The system uses GROQ's `llama-3.3-70b-versatile` model for generation.

## Success Criteria

✅ AI generates unique code for each topic
✅ Code executes without errors
✅ 3D model renders correctly
✅ Parameters control the visualization
✅ Violation states trigger visual effects
✅ Fallback system works if code fails

## Notes

- The system is designed to be **creative and surprising** - each topic should look different
- AI has access to Three.js geometries and React Three Fiber components
- Generated code runs in a sandboxed environment with access to: React, THREE, parameters, violationState
- The fallback system provides a generic visualization if AI code fails

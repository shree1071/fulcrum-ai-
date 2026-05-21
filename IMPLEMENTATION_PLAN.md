# Implementation Plan - Learning from Reference Repo

## What They Do (Full System)
1. **Blender/OpenSCAD Worker** - Generates actual GLB files from Python/SCAD scripts
2. **Multi-turn Agent Pipeline** - Up to 4 attempts with validation between each
3. **Visual Research Phase** - Gemini 2.0 Flash with Google Search for real specs
4. **Static Audits** - Geometry checks, React hook validation, spatial reasoning
5. **Hand-crafted References** - Show AI complete examples (F1 car, bicycle, tennis racket)

## What We Should Implement (Pragmatic Approach)

### Phase 1: Immediate Improvements ✅
1. **Template Library** (DONE)
   - Pre-built models for common topics
   - High quality, professionally designed
   - Instant rendering, no AI needed

2. **Better AI Prompts** (TODO)
   - Include their coordinate system rules
   - Show reference examples
   - Add spatial reasoning guidelines
   - Emphasize Y-up, ground at y=0

3. **Validation Layer** (TODO)
   - Check for minimum mesh count
   - Validate geometry types
   - Ensure proper structure
   - Reject obviously broken models

### Phase 2: Enhanced Generation (Optional)
1. **Visual Research**
   - Use Gemini API to research topics
   - Get real dimensions and specs
   - Generate structured briefs

2. **Multi-turn Pipeline**
   - Try generation
   - Validate
   - If fails, regenerate with error feedback
   - Max 2-3 attempts

### Phase 3: Advanced (Future)
1. **Blender Worker**
   - Separate service for complex models
   - Generate GLB files
   - Load with GLTFLoader in Three.js

## Key Learnings from Reference

### Coordinate System Rules
```
Y is UP
Ground is XZ plane at y=0
Objects stand on ground, extend +Y
Wheels: rotation [Math.PI/2, 0, 0] for vertical
```

### Quality Standards
- Minimum 20-25 mesh elements for complex objects
- Use multiple geometry types (not just boxes)
- Connected hierarchy (not floating parts)
- Real-world proportions

### React/Three.js Rules
- useMemo deps must be arrays: `useMemo(fn, [])` not `useMemo(fn, undefined)`
- useFrame for all animations
- Refs for arrays: `useRef([])` not `useRef()`
- No imports in generated code

## Recommended Next Steps

1. **Update AI Prompt** with their rules and examples
2. **Add Validation** before rendering models
3. **Expand Template Library** with more common topics
4. **Consider Gemini** for visual research phase

## What NOT to Do

❌ Don't try to implement full Blender worker now (too complex)
❌ Don't remove template system (it works well)
❌ Don't expect AI to generate perfect models every time
✅ Use templates for common topics
✅ Use AI only for truly custom topics
✅ Validate before rendering
✅ Show good examples to AI

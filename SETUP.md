# Fulcrum AI Setup Guide

## Quick Start (3 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then edit `.env` and add your NVIDIA API key:
```env
NVIDIA_API_KEY=nvapi-YOUR_KEY_HERE
```

**Get your free NVIDIA API key**: https://build.nvidia.com/
- Sign up with your email
- Navigate to any model (e.g., Nemotron)
- Click "Get API Key"
- Copy and paste into `.env`

### 3. Initialize Database
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

## First Test

1. Click "New Journal"
2. Type: `wind turbine`
3. Click "Generate"
4. Watch the 3-agent pipeline:
   - Research ✓ (instant)
   - Design... (streaming from NVIDIA)
   - Validate ✓ (instant)
5. See the 3D wind turbine appear with generated notes!

## Troubleshooting

### "No API key configured" error
- Make sure `.env` file exists in root directory
- Verify `NVIDIA_API_KEY=nvapi-...` is set
- Restart the dev server after changing `.env`

### Database errors
```bash
npx prisma generate
npx prisma migrate dev
```

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Monaco Editor not loading
- This is normal on first load
- Refresh the page
- Monaco loads dynamically (client-side only)

## Optional: Add Groq Fallback

If NVIDIA API is rate-limited, add Groq as fallback:

1. Get free API key: https://console.groq.com/
2. Add to `.env`:
```env
GROQ_API_KEY=gsk_YOUR_KEY_HERE
```

The system will automatically fallback to Groq if NVIDIA fails.

## Optional: Add Visual Verification

For AI-powered visual verification of simulations:

1. Get Google API key: https://ai.google.dev/
2. Add to `.env`:
```env
GOOGLE_API_KEY=YOUR_KEY_HERE
```

This enables the `/api/verify-model` endpoint.

## Development Tips

### Quality Modes
- **Fast Mode** (default): Uses Nemotron Nano 8B - Quick responses
- **High Quality**: Uses Nemotron Ultra 253B - Detailed explanations

Toggle in the top bar before generating.

### Keyboard Shortcuts
- `Enter` in topic input → Generate
- `Enter` in Ask AI drawer → Send question
- `Enter` when renaming journal → Save

### Testing Different Topics

Try these to test different simulations:
- `wind turbine` → PhysicsWindTurbine
- `newton's cradle` → PhysicsNewtonsCradle
- `rocket launch` → PhysicsRocket
- `projectile motion` → PhysicsProjectile
- `spring oscillator` → PhysicsSpringMass
- `satellite orbit` → PhysicsOrbit
- `bridge structure` → PhysicsBridge
- `water bottle pressure` → PhysicsWaterBottle
- `robotic arm` → Arm
- `anything else` → HighQualityModel (AI-generated)

## Next Steps

1. Read the full README.md for architecture details
2. Explore the physics knowledge base in `lib/physics-kb.ts`
3. Check out the simulation components in `app/editor/components/`
4. Try the Ask AI feature for contextual Q&A
5. Experiment with parameter changes and violation detection

## Support

- Check browser console for detailed error messages
- Verify API keys are valid and have credits
- Ensure Node.js version is 18+ (`node --version`)
- Check that port 3000 is available

Enjoy building with Fulcrum AI! 🚀

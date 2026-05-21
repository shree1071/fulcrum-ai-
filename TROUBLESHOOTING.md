# Fulcrum AI Troubleshooting Guide

## Common Issues and Solutions

### 1. Three.js Compatibility Error
**Error**: `TypeError: Cannot read properties of undefined (reading 'S')`

**Cause**: Version mismatch between Three.js and React Three Fiber

**Solution**: 
```bash
# Use these specific compatible versions:
npm install three@0.169.0 @react-three/fiber@8.17.10 @react-three/drei@9.114.3
```

The package.json is already configured with these versions. If you see this error:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### 2. "No API key configured" Error

**Cause**: Missing or incorrect API key in `.env`

**Solution**:
1. Check `.env` file exists in root directory
2. Verify format: `NVIDIA_API_KEY=nvapi-YOUR_KEY_HERE`
3. No quotes, no spaces around `=`
4. Restart dev server after changing `.env`

---

### 3. Monaco Editor Not Loading

**Symptom**: Editor area is blank or shows loading forever

**Cause**: Monaco loads dynamically on client-side only

**Solution**:
- Refresh the page (F5)
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors
- Ensure JavaScript is enabled

---

### 4. Database Errors

**Error**: `PrismaClientInitializationError` or migration errors

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Reset and recreate database
npx prisma migrate reset
npx prisma migrate dev --name init
```

---

### 5. Simulation Not Appearing

**Symptom**: 3D canvas is black or shows only grid

**Possible Causes**:
1. **No SIMCONFIG generated**: Check browser console for parsing errors
2. **Invalid simType**: Verify topic matches a known simulation
3. **WebGL not supported**: Check browser compatibility

**Solution**:
```javascript
// Open browser console (F12) and check for:
// - "Failed to parse simconfig" errors
// - WebGL warnings
// - Component rendering errors
```

Try these test topics:
- `wind turbine` ✓
- `newton's cradle` ✓
- `rocket` ✓

---

### 6. SSE Streaming Errors

**Error**: `Failed to fetch` or streaming stops mid-generation

**Possible Causes**:
1. API key invalid or rate limited
2. Network timeout
3. CORS issues (shouldn't happen in dev)

**Solution**:
1. Verify API key is valid: https://build.nvidia.com/
2. Check API credits/rate limits
3. Try Groq fallback:
   ```env
   GROQ_API_KEY=gsk_YOUR_KEY_HERE
   ```
4. Check browser Network tab for failed requests

---

### 7. Zustand State Not Persisting

**Symptom**: Journals disappear on page refresh

**Cause**: localStorage blocked or corrupted

**Solution**:
```javascript
// Open browser console and run:
localStorage.clear()
// Then refresh page
```

Check browser privacy settings allow localStorage.

---

### 8. Build Errors

**Error**: `Module not found` or TypeScript errors

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install

# Check for TypeScript errors
npm run build
```

---

### 9. Port 3000 Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Option 1: Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Option 2: Use different port
npm run dev -- -p 3001
```

---

### 10. Framer Motion Animation Issues

**Symptom**: Animations jerky or not working

**Cause**: React strict mode or performance issues

**Solution**:
- Disable React Strict Mode in `app/layout.tsx` (not recommended)
- Check browser performance (close other tabs)
- Reduce animation complexity

---

## Debug Mode

Enable detailed logging:

```javascript
// Add to app/editor/page.jsx
useEffect(() => {
  console.log('Current state:', {
    simType,
    simConfig,
    violationState,
    violations
  });
}, [simType, simConfig, violationState, violations]);
```

---

## Browser Compatibility

**Recommended**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**Required Features**:
- WebGL 2.0
- ES6 modules
- localStorage
- Server-Sent Events (SSE)

Check compatibility:
```javascript
// Open browser console
console.log('WebGL:', !!document.createElement('canvas').getContext('webgl2'));
console.log('localStorage:', typeof localStorage !== 'undefined');
```

---

## Performance Tips

### Slow Generation
- Use Fast mode instead of High Quality
- Check API response times in Network tab
- Verify internet connection

### Laggy 3D Rendering
- Reduce OrbitControls damping
- Lower particle counts in simulations
- Close other GPU-intensive applications
- Update graphics drivers

### High Memory Usage
- Limit number of open journals
- Clear browser cache regularly
- Restart dev server periodically

---

## Getting Help

1. **Check browser console** (F12) for errors
2. **Check terminal** where `npm run dev` is running
3. **Verify setup** with `node verify-setup.js`
4. **Test API keys** manually:
   ```bash
   curl -X POST https://integrate.api.nvidia.com/v1/chat/completions \
     -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"nvidia/llama-3.1-nemotron-nano-8b-v1","messages":[{"role":"user","content":"test"}]}'
   ```

---

## Still Having Issues?

1. Check Node.js version: `node --version` (should be 18+)
2. Check npm version: `npm --version` (should be 9+)
3. Try in incognito/private browsing mode
4. Disable browser extensions
5. Check firewall/antivirus settings

---

## Known Limitations

- Monaco Editor requires client-side rendering (no SSR)
- Three.js simulations require WebGL 2.0
- SSE streaming may not work through some proxies
- Large simulations may be slow on low-end GPUs
- API rate limits apply (check provider docs)

---

## Quick Reset

Nuclear option - reset everything:
```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules package-lock.json .next prisma/dev.db
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

This will give you a fresh start.

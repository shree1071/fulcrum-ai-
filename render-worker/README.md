# Fulcrum Render Worker

Blender-based render worker for generating high-quality 3D models from Python scripts.

## Setup

### Option 1: Docker (Recommended)

```bash
cd render-worker
docker build -t fulcrum-render-worker .
docker run -p 8787:8787 fulcrum-render-worker
```

### Option 2: Local Installation

Requirements:
- Blender 3.0+ installed and in PATH
- Node.js 20+

```bash
cd render-worker
npm install
npm start
```

## Usage

The render worker exposes a single endpoint:

**POST /render**

Request body:
```json
{
  "generator": "blender",
  "script": "import bpy\n...",
  "topic": "helicopter",
  "screenshot": true
}
```

Response:
```json
{
  "success": true,
  "glbBase64": "...",
  "thumbnailBase64": "..."
}
```

## Environment Variables

- `PORT` - Server port (default: 8787)

## Integration with Fulcrum

The main Fulcrum app calls this worker when generating custom 3D models. The worker:

1. Receives Python/Blender script
2. Executes script in headless Blender
3. Exports GLB file
4. Returns base64-encoded GLB

## Notes

- The worker runs Blender in headless mode (`--background`)
- GLB files are exported to `/tmp/output.glb`
- Thumbnails are rendered to `/tmp/thumbnail.png`
- All outputs are base64-encoded for easy transport

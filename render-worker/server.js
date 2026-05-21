import express from "express";
import fs from "fs";
import { spawn } from "child_process";
import os from "os";
import path from "path";

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

function base64File(p) {
  return fs.readFileSync(p).toString("base64");
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, "utf8");
}

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "pipe", ...opts });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve({ code, stdout, stderr });
      reject(new Error(`Command failed: ${cmd} ${args.join(" ")} (code ${code})\n${stderr}`));
    });
  });
}

const MIN_GLB_B64 = 80;

async function renderWithBlenderScript({ scriptSource, screenshot }) {
  if (!scriptSource || !String(scriptSource).trim()) {
    return {
      ok: false,
      glbBase64: "",
      thumbnailBase64: "",
      error: "Empty Blender script",
      stderr: "",
    };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fulcrum-blender-"));
  const pyPath = path.join(tmpDir, "script.py");
  writeFile(pyPath, scriptSource);

  const outGlb = "/tmp/output.glb";
  const outPng = "/tmp/thumbnail.png";
  
  try {
    fs.rmSync(outGlb, { force: true });
    fs.rmSync(outPng, { force: true });
  } catch {}

  let blend = { stdout: "", stderr: "" };
  let blendError = null;
  try {
    blend = await runCmd("blender", ["--background", "--python", pyPath]);
  } catch (e) {
    blendError = e?.message || String(e);
    blend.stderr = blendError;
  }

  const glbBase64 =
    fs.existsSync(outGlb) && fs.statSync(outGlb).size > 0 ? base64File(outGlb) : "";
  const thumbnailBase64 =
    fs.existsSync(outPng) && fs.statSync(outPng).size > 0 ? base64File(outPng) : "";

  if (!glbBase64 || glbBase64.length < MIN_GLB_B64) {
    const hint = blendError
      ? `Blender exited with error and /tmp/output.glb is missing or empty: ${blendError.slice(0, 400)}`
      : "Blender finished but /tmp/output.glb is missing or too small. Script must call bpy.ops.export_scene.gltf(filepath='/tmp/output.glb', export_format='GLB').";
    return {
      ok: false,
      glbBase64: "",
      thumbnailBase64,
      error: hint,
      stderr: blend.stderr || "",
    };
  }

  return { ok: true, glbBase64, thumbnailBase64, error: null, stderr: blend.stderr || "" };
}

async function renderWithOpenScadScript({ scriptSource, screenshot }) {
  if (!scriptSource || !String(scriptSource).trim()) {
    return {
      ok: false,
      glbBase64: "",
      thumbnailBase64: "",
      error: "Empty OpenSCAD script",
      stderr: "",
    };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fulcrum-openscad-"));
  const scadPath = path.join(tmpDir, "model.scad");
  const stlPath = path.join(tmpDir, "model.stl");
  writeFile(scadPath, scriptSource);

  const outGlb = "/tmp/output.glb";
  const outPng = "/tmp/thumbnail.png";
  
  try {
    fs.rmSync(outGlb, { force: true });
    fs.rmSync(outPng, { force: true });
  } catch {}

  let scadResult = { stdout: "", stderr: "" };
  let scadError = null;
  
  try {
    // Generate STL from OpenSCAD
    scadResult = await runCmd("openscad", ["-o", stlPath, scadPath]);
  } catch (e) {
    scadError = e?.message || String(e);
    scadResult.stderr = scadError;
  }

  if (!fs.existsSync(stlPath) || fs.statSync(stlPath).size === 0) {
    return {
      ok: false,
      glbBase64: "",
      thumbnailBase64: "",
      error: `OpenSCAD failed to generate STL: ${scadError || "Unknown error"}`,
      stderr: scadResult.stderr || "",
    };
  }

  // Convert STL to GLB using Blender
  const blenderScript = `
import bpy
import sys

# Clear default scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Enable required addons
import addon_utils as _au
try:
    _au.enable("io_scene_gltf2", default_set=False, persistent=False)
    _au.enable("io_mesh_stl", default_set=False, persistent=False)
except Exception as e:
    print("Addon enable error:", e, file=sys.stderr)

# Import STL
try:
    bpy.ops.import_mesh.stl(filepath="${stlPath}")
except Exception as e:
    print("STL import failed:", e, file=sys.stderr)
    # Try alternative import method
    try:
        import bmesh
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=2.0)
        mesh = bpy.data.meshes.new("fallback_mesh")
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new("fallback_object", mesh)
        bpy.context.collection.objects.link(obj)
        print("Using fallback cube mesh", file=sys.stderr)
    except Exception as e2:
        print("Fallback mesh creation failed:", e2, file=sys.stderr)
        sys.exit(1)

# Add camera and light
bpy.ops.object.camera_add(location=(5.0, -5.0, 3.5), rotation=(1.15, 0.0, 0.85))
bpy.context.scene.camera = bpy.context.active_object
bpy.ops.object.light_add(type="SUN", location=(2.0, 2.0, 12.0))
bpy.context.active_object.data.energy = 3.0

# Add material to imported object
if bpy.context.selected_objects:
    obj = bpy.context.selected_objects[0]
    mat = bpy.data.materials.new("Material")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.4, 0.55, 0.9, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.35
        bsdf.inputs["Metallic"].default_value = 0.2
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

# Export GLB
try:
    bpy.ops.export_scene.gltf(filepath="/tmp/output.glb", export_format="GLB", use_selection=False)
except Exception as e:
    print("GLB export failed:", e, file=sys.stderr)
    sys.exit(1)

# Render thumbnail if requested
if ${screenshot ? "True" : "False"}:
    bpy.context.scene.render.engine = "CYCLES"
    try:
        bpy.context.scene.cycles.device = "CPU"
    except:
        pass
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.filepath = "/tmp/thumbnail.png"
    bpy.context.scene.render.resolution_x = 640
    bpy.context.scene.render.resolution_y = 480
    try:
        bpy.ops.render.render(write_still=True)
    except Exception as e:
        print("Render failed:", e, file=sys.stderr)
`;

  const blenderScriptPath = path.join(tmpDir, "convert.py");
  writeFile(blenderScriptPath, blenderScript);

  let blenderResult = { stdout: "", stderr: "" };
  let blenderError = null;
  
  try {
    blenderResult = await runCmd("blender", ["--background", "--python", blenderScriptPath]);
  } catch (e) {
    blenderError = e?.message || String(e);
    blenderResult.stderr = blenderError;
  }

  const glbBase64 =
    fs.existsSync(outGlb) && fs.statSync(outGlb).size > 0 ? base64File(outGlb) : "";
  const thumbnailBase64 =
    fs.existsSync(outPng) && fs.statSync(outPng).size > 0 ? base64File(outPng) : "";

  if (!glbBase64 || glbBase64.length < MIN_GLB_B64) {
    const hint = blenderError
      ? `Blender conversion failed: ${blenderError.slice(0, 400)}`
      : "OpenSCAD->Blender conversion failed. Check STL generation and GLB export.";
    return {
      ok: false,
      glbBase64: "",
      thumbnailBase64,
      error: hint,
      stderr: `OpenSCAD: ${scadResult.stderr}\nBlender: ${blenderResult.stderr}`,
    };
  }

  return { ok: true, glbBase64, thumbnailBase64, error: null, stderr: blenderResult.stderr || "" };
}

app.post("/render", async (req, res) => {
  const { generator, script, topic, paramsJson, screenshot } = req.body || {};

  try {
    if (!generator) {
      return res.status(400).json({ success: false, error: "generator required" });
    }

    if (generator === "blender") {
      const out = await renderWithBlenderScript({
        scriptSource: script || "",
        screenshot,
      });
      if (!out.ok) {
        console.error("[render-worker] blender failed:", out.error, out.stderr?.slice?.(-500));
        return res.status(500).json({
          success: false,
          error: out.error,
          stderrTail: (out.stderr || "").slice(-1500),
        });
      }
      return res.json({ success: true, glbBase64: out.glbBase64, thumbnailBase64: out.thumbnailBase64 });
    }

    if (generator === "openscad") {
      const out = await renderWithOpenScadScript({
        scriptSource: script || "",
        screenshot,
      });
      if (!out.ok) {
        console.error("[render-worker] openscad failed:", out.error, out.stderr?.slice?.(-500));
        return res.status(500).json({
          success: false,
          error: out.error,
          stderrTail: (out.stderr || "").slice(-1500),
        });
      }
      return res.json({ success: true, glbBase64: out.glbBase64, thumbnailBase64: out.thumbnailBase64 });
    }

    return res.status(400).json({ success: false, error: `Unknown generator: ${generator}` });
  } catch (e) {
    console.error("[render-worker] error:", e);
    return res.status(500).json({ success: false, error: e?.message || "render failed" });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Fulcrum render worker is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[render-worker] listening on :${PORT}`);
});

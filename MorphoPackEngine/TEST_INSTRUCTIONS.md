# Testing the Geometry Pre-Processor

## Quick Test Instructions

### Prerequisites
1. **Blender 4.2+** installed with path set correctly
2. **Python dependencies** installed: `pip install flask flask-cors trimesh numpy`
3. **Paper Model Addon** enabled in Blender:
   - Open Blender
   - Edit → Preferences → Extensions
   - Search "Paper Model" or "Export Paper Model"
   - Enable `bl_ext.blender_org.export_paper_model`

### Test 1: Simple Mesh (Baseline)

```bash
# 1. Start the server
cd MorphoPack/MorphoPackEngine
python server.py

# 2. Upload a simple mesh (< 1,500 faces)
# The existing perfume.stl in uploads/ folder is a good test
curl -X POST http://localhost:5050/api/upload \
  -F "mesh=@uploads/perfume.stl"

# 3. Monitor status (should complete in ~5-10 seconds)
curl http://localhost:5050/api/pipeline-status | python -m json.tool

# 4. Check outputs
curl http://localhost:5050/api/outputs/preview.glb -o test_output.glb
curl http://localhost:5050/api/outputs/dieline_pattern.svg -o test_output.svg

# 5. Verify outputs exist and have reasonable file sizes
ls -lh test_output.*
```

**Expected Result:**
- Status: `"status": "done"`
- No errors
- Both GLB and SVG files created
- Processing time: 5-15 seconds
- Console logs show:
  - `[GEOM-PREP] Analyzing mesh complexity...`
  - `[GEOM-PREP] Stage 1/3: Applying WELD modifier...`
  - `[GEOM-PREP] Stage 2/3: Mesh within safe limits` (if < 1,500 faces)
  - `[GEOM-PREP] Stage 3/3: Cleaning degenerate geometry...`
  - `[EXPORT] ✓ GLB export successful`
  - `[EXPORT] ✓ Direct module unfold successful`
  - `[SUCCESS] Pipeline completed successfully!`

### Test 2: Complex Mesh (Pre-Processor Activation)

To test the full pre-processor, you need a mesh with >1,500 faces:

**Option A: Create Test Mesh in Blender**
```python
# In Blender's Python Console:
import bpy
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=64)
bpy.ops.export_mesh.stl(filepath="C:/temp/complex_sphere.stl")
```

**Option B: Use Online Test Models**
Download from https://www.thingiverse.com or similar (look for "detailed" or "high-poly" models)

```bash
# Upload complex mesh
curl -X POST http://localhost:5050/api/upload \
  -F "mesh=@/path/to/complex_model.stl"

# Monitor (may take 15-30 seconds)
curl http://localhost:5050/api/pipeline-status | python -m json.tool
```

**Expected Result:**
- Console logs show:
  - `[GEOM-PREP] Stage 2/3: Mesh exceeds safe threshold (X > 1500)`
  - `[GEOM-PREP] Initiating DECIMATE modifier...`
  - `[GEOM-PREP] ✓ Decimation complete.`
  - `[GEOM-PREP]   Before: XXXX faces`
  - `[GEOM-PREP]   After:  1500 faces (XX.X% reduction)`
- Final status: `"done"` (not `"error"`)
- Both outputs created successfully

### Test 3: Pipeline Status API

```bash
# While pipeline is running, poll status
watch -n 1 'curl -s http://localhost:5050/api/pipeline-status | python -m json.tool'
```

**Expected Output:**
```json
{
  "id": "job_abc12345",
  "status": "running",
  "step": "Stage 2: DECIMATE — Reduce polygon count",
  "steps_done": [
    "Mesh import & validation",
    "Displacement modifier (2mm clearance)",
    "Stage 1: WELD — Merge duplicate vertices"
  ],
  "error": null,
  "file": "test_model.stl",
  "outputs": {
    "glb_ready": false,
    "glb_url": null,
    "svg_ready": false,
    "svg_url": null
  }
}
```

### Test 4: Error Handling

**Test non-existent Blender path:**
```bash
# In server.py, temporarily set wrong path:
# BLENDER_EXE = "C:/wrong/path/blender.exe"

python server.py
# Upload mesh → should see clear error about Blender not found
```

**Test without Paper Model addon:**
```bash
# Disable addon in Blender
# Upload mesh → should see error about addon initialization
```

### Validation Checklist

After successful test, verify:
- [ ] Server starts without errors
- [ ] Upload endpoint accepts STL/OBJ files
- [ ] Pipeline status updates in real-time
- [ ] Geometry pre-processor logs appear
- [ ] Complex meshes get decimated automatically
- [ ] Simple meshes skip decimation
- [ ] Both GLB and SVG outputs created
- [ ] SVG can be opened in browser/Inkscape
- [ ] GLB can be viewed in https://gltf-viewer.donmccurdy.com/
- [ ] No "code 1" errors
- [ ] Processing completes in <30 seconds

### Troubleshooting

**Problem:** `Paper Model extension could not be initialized`
**Solution:** 
1. Open Blender GUI
2. Edit → Preferences → Extensions
3. Enable "Export Paper Model" addon
4. Save preferences

**Problem:** `Blender not found at: ...`
**Solution:**
1. Set environment variable: `$env:BLENDER_PATH="C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"`
2. Or update `BLENDER_EXE` in `server.py` line 25

**Problem:** `No output files produced`
**Solution:**
1. Check console logs for `[GEOM-PREP]` messages
2. Verify mesh face count (run in Blender: `len(bpy.context.object.data.polygons)`)
3. Check if mesh is manifold (no holes, flipped normals)
4. Try increasing `MAX_SAFE_FACE_COUNT` to 2000

**Problem:** SVG created but appears empty
**Solution:**
1. Check file size (should be >100 KB)
2. Open in text editor, verify `<path` elements exist
3. Check if mesh was too simple (< 10 faces)
4. Try re-running with different input mesh

### Performance Benchmarks

| Mesh Complexity | Face Count | Expected Time | Decimation |
|----------------|-----------|---------------|-----------|
| Simple | < 500 | 3-5 seconds | No |
| Medium | 500-1,500 | 5-10 seconds | No |
| Complex | 1,500-5,000 | 10-20 seconds | Yes |
| Very Complex | 5,000-15,000 | 20-40 seconds | Yes |
| Extreme | > 15,000 | 40-60 seconds | Yes |

If processing takes longer than these ranges, consider reducing `MAX_SAFE_FACE_COUNT`.

---

## Automated Test Script

Save as `test_pipeline.sh`:

```bash
#!/bin/bash

echo "=== MorphoPack Pipeline Test Suite ==="
echo ""

# Test 1: Health Check
echo "[1/4] Testing health endpoint..."
HEALTH=$(curl -s http://localhost:5050/api/health | grep healthy)
if [ -n "$HEALTH" ]; then
  echo "✅ Server healthy"
else
  echo "❌ Server not responding"
  exit 1
fi

# Test 2: Upload
echo ""
echo "[2/4] Uploading test mesh..."
UPLOAD=$(curl -s -X POST http://localhost:5050/api/upload \
  -F "mesh=@uploads/perfume.stl")
echo "$UPLOAD" | grep -q success
if [ $? -eq 0 ]; then
  echo "✅ Upload successful"
else
  echo "❌ Upload failed"
  exit 1
fi

# Test 3: Wait for completion
echo ""
echo "[3/4] Waiting for pipeline completion..."
for i in {1..30}; do
  STATUS=$(curl -s http://localhost:5050/api/pipeline-status | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "  Status: $STATUS"
  
  if [ "$STATUS" = "done" ]; then
    echo "✅ Pipeline completed"
    break
  elif [ "$STATUS" = "error" ]; then
    echo "❌ Pipeline failed"
    exit 1
  fi
  
  sleep 2
done

# Test 4: Download outputs
echo ""
echo "[4/4] Downloading outputs..."
curl -s http://localhost:5050/api/outputs/preview.glb -o test.glb
curl -s http://localhost:5050/api/outputs/dieline_pattern.svg -o test.svg

if [ -f test.glb ] && [ -s test.glb ]; then
  echo "✅ GLB created ($(stat -f%z test.glb 2>/dev/null || stat -c%s test.glb) bytes)"
else
  echo "❌ GLB missing or empty"
  exit 1
fi

if [ -f test.svg ] && [ -s test.svg ]; then
  echo "✅ SVG created ($(stat -f%z test.svg 2>/dev/null || stat -c%s test.svg) bytes)"
else
  echo "❌ SVG missing or empty"
  exit 1
fi

echo ""
echo "=== All Tests Passed! ==="
```

Run with: `bash test_pipeline.sh`

---

**Test Completion Date:** ___________  
**Tested By:** ___________  
**Result:** ☐ Pass ☐ Fail ☐ Partial  
**Notes:** ___________

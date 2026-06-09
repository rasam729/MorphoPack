import sys
import trimesh
import numpy as np
import fast_simplification

mesh_path = "uploads/haunter_pot.stl"
mesh = trimesh.load(mesh_path, force="mesh")
mesh.merge_vertices()

verts = np.array(mesh.vertices)
faces = np.array(mesh.faces)
print(f"Original faces: {len(faces)}")

target_count = 800
reduction = 1.0 - (target_count / len(faces))
print(f"Target reduction: {reduction}")

v_out, f_out = fast_simplification.simplify(verts, faces, target_reduction=reduction)
print(f"Decimated to: {len(f_out)}")

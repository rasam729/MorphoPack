import sys
import glob
from pathlib import Path

# Load fallback from server
from server import _generate_dieline_fallback

uploads = list(Path("uploads").glob("*.*"))
if not uploads:
    print("No uploads found.")
    sys.exit(1)

mesh = str(uploads[0])
print(f"Testing fallback on: {mesh}")

try:
    _generate_dieline_fallback(mesh, "outputs/test_dieline.svg")
except Exception as e:
    print(f"Error: {e}")

import os
import shutil

src_root = r"d:\Vhoa_Management"
dest_root = r"D:\github code cc\vhoa"

IGNORE_DIRS = {'node_modules', '__pycache__', '.git', '.venv', 'venv', 'dist', 'build', '.vscode'}
IGNORE_EXTS = {'.pyc', '.pyo'}

print("=== STARTING COMPREHENSIVE COPY PROCESS ===")

# Copy backend & frontend recursively
for folder in ["backend", "frontend"]:
    src_folder = os.path.join(src_root, folder)
    dest_folder = os.path.join(dest_root, folder)
    
    if os.path.exists(src_folder):
        for root, dirs, files in os.walk(src_folder):
            # Prune ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            rel_path = os.path.relpath(root, src_root)
            target_dir = os.path.join(dest_root, rel_path)
            os.makedirs(target_dir, exist_ok=True)
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in IGNORE_EXTS:
                    continue
                
                src_file = os.path.join(root, file)
                dest_file = os.path.join(target_dir, file)
                
                shutil.copy2(src_file, dest_file)

print("=== COPY PROCESS COMPLETED SUCCESSFULLY ===")


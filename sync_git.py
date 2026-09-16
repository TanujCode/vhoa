import os
import shutil

src = r"d:\Vhoa_Management"
dst = r"D:\github code cc\vhoa"

ignore_dirs = {
    'venv', '.venv', '__pycache__', '.pytest_cache', 'uploads', 
    'node_modules', 'dist', '.vite', '.git', '.idea', '.vscode', '.system_generated'
}
ignore_files = {'.env', 'hoa.sqlite3', 'rental.sqlite3', 'sync_git.py'}
ignore_exts = {'.pyc', '.pyo', '.sqlite3', '.log'}

copied_count = 0
for root, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if d not in ignore_dirs]
    rel_path = os.path.relpath(root, src)
    if any(part in ignore_dirs for part in rel_path.split(os.sep)):
        continue
    target_dir = os.path.join(dst, rel_path)
    os.makedirs(target_dir, exist_ok=True)
    for file in files:
        if file in ignore_files or any(file.endswith(ext) for ext in ignore_exts):
            continue
        src_file = os.path.join(root, file)
        dst_file = os.path.join(target_dir, file)
        
        # Check if modified or new
        if not os.path.exists(dst_file) or os.path.getmtime(src_file) > os.path.getmtime(dst_file) or os.path.getsize(src_file) != os.path.getsize(dst_file):
            shutil.copy2(src_file, dst_file)
            copied_count += 1
            print(f"Copied: {os.path.relpath(src_file, src)}")

print(f"=== Sync complete. Total files synced: {copied_count} ===")

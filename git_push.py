import os
import shutil
import subprocess

src = r"d:\Vhoa_Management"
dst = r"D:\github code cc\vhoa"
git_exe = r"C:\Program Files\Git\bin\git.exe"

# 1. Clean any accidental powershell.bat or temp files in workspace
for p in [os.path.join(src, "powershell.bat"), os.path.join(dst, "powershell.bat")]:
    if os.path.exists(p):
        try:
            os.remove(p)
            print(f"Removed temp file: {p}")
        except Exception as e:
            print(f"Could not remove {p}: {e}")

# Scratch / temp files in backend to clean
scratch_files = [
    os.path.join(src, "backend", "contracts_get_debug.txt"),
    os.path.join(src, "backend", "db_debug.txt"),
    os.path.join(src, "backend", "search_results.txt"),
    os.path.join(dst, "backend", "contracts_get_debug.txt"),
    os.path.join(dst, "backend", "db_debug.txt"),
    os.path.join(dst, "backend", "search_results.txt"),
]
for f in scratch_files:
    if os.path.exists(f):
        try:
            os.remove(f)
            print(f"Cleaned scratch file: {f}")
        except Exception:
            pass

ignore_dirs = {
    'venv', '.venv', '__pycache__', '.pytest_cache', 'uploads', 
    'node_modules', 'dist', '.vite', '.git', '.idea', '.vscode', 
    '.system_generated', 'alembic_backup'
}
ignore_files = {
    '.env', 'hoa.sqlite3', 'rental.sqlite3', 'sync_git.py', 'git_push.py',
    'copy_to_git.bat', 'copy_to_git.py', 'inspect_pdf.py',
    'contracts_get_debug.txt', 'db_debug.txt', 'search_results.txt'
}
ignore_exts = {'.pyc', '.pyo', '.sqlite3', '.log', '.tmp'}

print("\n--- Starting Sync to GitHub Repository Directory ---")
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
        
        if not os.path.exists(dst_file) or os.path.getmtime(src_file) > os.path.getmtime(dst_file) or os.path.getsize(src_file) != os.path.getsize(dst_file):
            shutil.copy2(src_file, dst_file)
            copied_count += 1
            print(f"Synced: {os.path.relpath(src_file, src)}")

print(f"Total files synced: {copied_count}")

# 2. Git status, add, commit, push
print("\n--- Running Git Add ---")
res_add = subprocess.run([git_exe, "-C", dst, "add", "-A"], capture_output=True, text=True)
print("Git Add Output:\n", res_add.stdout, res_add.stderr)

print("\n--- Running Git Status ---")
res_status = subprocess.run([git_exe, "-C", dst, "status", "--short"], capture_output=True, text=True)
print("Git Status Output:\n", res_status.stdout)

print("\n--- Running Git Commit ---")
commit_msg = "feat: US physical address auto-fill, international phone country validation, optional maintenance description, and portal improvements"
res_commit = subprocess.run([git_exe, "-C", dst, "commit", "-m", commit_msg], capture_output=True, text=True)
print("Git Commit Output:\n", res_commit.stdout, res_commit.stderr)

print("\n--- Running Git Push ---")
res_push = subprocess.run([git_exe, "-C", dst, "push", "origin", "main"], capture_output=True, text=True)
print("Git Push Output:\n", res_push.stdout, res_push.stderr)

if res_push.returncode == 0:
    print("\nSUCCESS: All changes successfully pushed to GitHub (origin/main)!")
else:
    # Try default git push
    res_push2 = subprocess.run([git_exe, "-C", dst, "push"], capture_output=True, text=True)
    print("Fallback Git Push Output:\n", res_push2.stdout, res_push2.stderr)
    if res_push2.returncode == 0:
        print("\nSUCCESS: All changes successfully pushed to GitHub!")
    else:
        print("\nPush finished with returncode:", res_push.returncode)

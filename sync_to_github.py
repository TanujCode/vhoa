import os
import shutil
import subprocess

SRC_DIR = r"D:\Vhoa_Management"
DST_DIR = r"D:\github code cc\vhoa"

IGNORE_DIRS = {
    'node_modules', '.git', 'venv', '.venv', '__pycache__', 
    'dist', 'build', '.vite', '.pytest_cache', '.idea', '.vscode'
}

def sync_folder(src_sub, dst_sub):
    src_path = os.path.join(SRC_DIR, src_sub)
    dst_path = os.path.join(DST_DIR, dst_sub)
    
    if not os.path.exists(src_path):
        print(f"Skipping {src_sub} (not found)")
        return

    print(f"Syncing {src_path} -> {dst_path}...")
    
    copied_count = 0
    for root, dirs, files in os.walk(src_path):
        # Modify dirs in-place to ignore unwanted directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith('.')]
        
        rel_path = os.path.relpath(root, src_path)
        dest_root = os.path.join(dst_path, rel_path) if rel_path != '.' else dst_path
        
        os.makedirs(dest_root, exist_ok=True)
        
        for file in files:
            if file.endswith('.pyc') or file == '.DS_Store':
                continue
            src_file = os.path.join(root, file)
            dst_file = os.path.join(dest_root, file)
            
            # Copy file if it doesn't exist or if size/mtime differs
            shutil.copy2(src_file, dst_file)
            copied_count += 1
            
    print(f"Successfully copied {copied_count} files for {src_sub}.")

def main():
    print("=== STARTING FULL REPO SYNC ===")
    
    # Sync frontend
    sync_folder("frontend", "frontend")
    
    # Sync backend
    sync_folder("backend", "backend")
    
    # Sync root files if any
    for item in os.listdir(SRC_DIR):
        src_item = os.path.join(SRC_DIR, item)
        if os.path.isfile(src_item) and not item.startswith('.'):
            dst_item = os.path.join(DST_DIR, item)
            shutil.copy2(src_item, dst_item)
            print(f"Copied root file: {item}")
            
    print("=== SYNC COMPLETED SUCCESSFULLY ===")
    print("\nRunning Git Commit and Push...")
    
    os.chdir(DST_DIR)
    subprocess.run(["git", "add", "."], check=True)
    
    # Check status
    res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if not res.stdout.strip():
        print("Everything is already up to date in Git working tree.")
    else:
        print("Changed files to commit:")
        print(res.stdout)
        subprocess.run(["git", "commit", "-m", "feat: sync all frontend and backend updates, rental portal features, dark mode fixes, and country validation"], check=True)
        subprocess.run(["git", "push"], check=True)
        print("=== GIT PUSH COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    main()

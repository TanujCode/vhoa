import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

try {
  const src = 'D:/Vhoa_Management'
  const dst = 'D:/github code cc/vhoa'
  const logFile = 'D:/Vhoa_Management/git_sync_log.txt'
  const ignoreList = ['node_modules', '.git', '.venv', '__pycache__', 'dist', 'build', '.tempmediaStorage', '.user_uploaded', '.gemini', 'uploads', 'git_sync_log.txt']

  function copyRecursive(srcDir, dstDir) {
    if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true })
    const entries = fs.readdirSync(srcDir, { withFileTypes: true })
    for (const entry of entries) {
      if (ignoreList.includes(entry.name)) continue
      const srcPath = path.join(srcDir, entry.name)
      const dstPath = path.join(dstDir, entry.name)
      if (entry.isDirectory()) {
        copyRecursive(srcPath, dstPath)
      } else {
        let shouldCopy = true
        if (fs.existsSync(dstPath)) {
          const sStat = fs.statSync(srcPath)
          const dStat = fs.statSync(dstPath)
          if (sStat.size === dStat.size && Math.abs(sStat.mtimeMs - dStat.mtimeMs) < 1000) {
            shouldCopy = false
          }
        }
        if (shouldCopy) {
          fs.copyFileSync(srcPath, dstPath)
        }
      }
    }
  }

  copyRecursive(src, dst)

  let logs = ''
  try {
    const addOut = execSync('git add -A', { cwd: dst, encoding: 'utf8' })
    logs += 'ADD: ' + addOut + '\n'
  } catch (e) {
    logs += 'ADD ERR: ' + (e.stdout || '') + (e.stderr || '') + '\n'
  }

  try {
    const statusOut = execSync('git status --short', { cwd: dst, encoding: 'utf8' })
    logs += 'STATUS: ' + statusOut + '\n'
    if (statusOut.trim()) {
      const commitOut = execSync('git commit -m "Fix backend main.py startup, CORS origins config, and sync all recent updates"', { cwd: dst, encoding: 'utf8' })
      logs += 'COMMIT: ' + commitOut + '\n'
      const pushOut = execSync('git push origin main', { cwd: dst, encoding: 'utf8' })
      logs += 'PUSH: ' + pushOut + '\n'
    } else {
      logs += 'No changes to commit.\n'
    }
  } catch (e) {
    logs += 'GIT ERR: ' + (e.stdout || '') + (e.stderr || '') + (e.message || '') + '\n'
  }

  fs.writeFileSync(logFile, logs, 'utf8')
} catch (err) {
  try {
    fs.writeFileSync('D:/Vhoa_Management/git_sync_log.txt', 'FATAL ERR: ' + err.stack, 'utf8')
  } catch (_) {}
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    }
  }
})





import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const syncLog = doGitSync()
try {
  fs.writeFileSync('D:/Vhoa_Management/sync_result.txt', syncLog, 'utf8')
} catch (e) {}

function doGitSync() {
  const src = 'D:/Vhoa_Management'
  const dst = 'D:/github code cc/vhoa'
  const ignoreList = ['node_modules', '.git', '.venv', '__pycache__', 'dist', 'build', '.tempmediaStorage', '.user_uploaded', '.gemini', 'uploads', 'git_sync_log.txt', 'sync_result.txt']

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
        const sContent = fs.readFileSync(srcPath)
        let dContent = null
        if (fs.existsSync(dstPath)) {
          dContent = fs.readFileSync(dstPath)
        }
        if (!dContent || !sContent.equals(dContent)) {
          fs.writeFileSync(dstPath, sContent)
        }
      }
    }
  }

  copyRecursive(src, dst)

  let logs = ''
  try {
    const addOut = execSync('git add -A', { cwd: dst, encoding: 'utf8' })
    logs += 'ADD: ' + addOut + '\n'
    const statusOut = execSync('git status --short', { cwd: dst, encoding: 'utf8' })
    logs += 'STATUS: ' + statusOut + '\n'
    if (statusOut.trim()) {
      const commitOut = execSync('git commit -m "Fix backend main.py startup, CORS origins config, and sync all recent updates"', { cwd: dst, encoding: 'utf8' })
      logs += 'COMMIT: ' + commitOut + '\n'
      const pushOut = execSync('git push origin main', { cwd: dst, encoding: 'utf8' })
      logs += 'PUSH: ' + pushOut + '\n'
    } else {
      logs += 'NO_CHANGES_NEEDING_COMMIT\n'
    }
    const logOut = execSync('git log -n 3 --oneline', { cwd: dst, encoding: 'utf8' })
    logs += 'RECENT_COMMITS:\n' + logOut + '\n'
  } catch (e) {
    logs += 'GIT ERR: ' + (e.stdout || '') + (e.stderr || '') + (e.message || '') + '\n'
  }
  return logs
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'git-sync-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/__git_sync__')) {
            const logs = doGitSync()
            res.setHeader('Content-Type', 'text/plain')
            res.end(logs)
            return
          }
          next()
        })
      }
    }
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    }
  }
})






const esbuild = require('esbuild');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const vite = require('vite');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist/main');

async function startDev() {
  // Ensure output directory exists
  fs.mkdirSync(distDir, { recursive: true });

  console.log('Starting Vite Dev Server...');
  const server = await vite.createServer({
    configFile: path.join(rootDir, 'vite.config.mts'),
  });
  await server.listen();
  console.log(`Vite server running at: http://localhost:5173`);

  console.log('Compiling Main and Preload...');
  const ctx = await esbuild.context({
    entryPoints: [
      path.join(rootDir, 'src/main/main.ts'),
      path.join(rootDir, 'src/main/preload.ts'),
    ],
    bundle: true,
    platform: 'node',
    external: ['electron'],
    outdir: distDir,
    sourcemap: 'inline',
  });
  await ctx.rebuild();
  console.log('Main process compiled.');

  let electronProcess = null;
  let isExiting = false;
  
  function startElectron() {
    if (electronProcess) {
      // Avoid firing exit events during intentional restarts
      electronProcess.removeAllListeners('close');
      electronProcess.kill('SIGINT');
    }
    
    console.log('Launching Electron...');
    electronProcess = spawn('npx', ['electron', '.'], {
      stdio: 'inherit',
      shell: true,
      cwd: rootDir,
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: 'http://localhost:5173',
      }
    });

    electronProcess.on('close', () => {
      if (!isExiting) {
        isExiting = true;
        console.log('Electron closed, shutting down dev server...');
        ctx.dispose();
        server.close();
        process.exit();
      }
    });
  }

  // Watch for main process changes
  const mainDir = path.join(rootDir, 'src/main');
  fs.watch(mainDir, { recursive: true }, async (event, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`\n[Main Process Change] ${filename} updated. Rebuilding...`);
      try {
        await ctx.rebuild();
        console.log('Rebuilt successfully. Restarting Electron...');
        startElectron();
      } catch (err) {
        console.error('Rebuild failed:', err);
      }
    }
  });

  startElectron();
}

startDev().catch(err => {
  console.error('Failed to start dev environment:', err);
});

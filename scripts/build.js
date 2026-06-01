const esbuild = require('esbuild');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist/main');

// Ensure output directory exists
fs.mkdirSync(distDir, { recursive: true });

console.log('Building Electron Main & Preload...');
try {
  esbuild.buildSync({
    entryPoints: [
      path.join(rootDir, 'src/main/main.ts'),
      path.join(rootDir, 'src/main/preload.ts'),
    ],
    bundle: true,
    platform: 'node',
    external: ['electron'],
    outdir: distDir,
    minify: true,
    sourcemap: true,
  });
  console.log('Main & Preload compiled successfully.');
} catch (error) {
  console.error('Failed to compile Main / Preload:', error);
  process.exit(1);
}

console.log('Building React Renderer...');
try {
  execSync('npx vite build', { stdio: 'inherit', cwd: rootDir });
  console.log('Renderer built successfully.');
} catch (error) {
  console.error('Failed to build Renderer:', error);
  process.exit(1);
}

console.log('Build complete!');

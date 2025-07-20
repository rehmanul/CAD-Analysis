const { spawn } = require('child_process');

console.log('Starting Vite development server...');

const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

vite.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});
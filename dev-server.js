// dev-server.js
// Pembungkus dev server agar kompatibel dengan lingkungan port/host apapun (container, lokal, atau script npm)
const { spawn } = require('child_process');
const path = require('path');

const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

// Normalisasi argumen: jika ada --host ubah menjadi -H agar diterima oleh Next.js CLI
const rawArgs = process.argv.slice(2);
const finalArgs = ['dev'];

let hasPort = false;
let hasHost = false;

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--port' || arg === '-p') {
    hasPort = true;
    finalArgs.push('-p', rawArgs[i + 1] || '3000');
    i++;
  } else if (arg === '--host' || arg === '--hostname' || arg === '-H') {
    hasHost = true;
    finalArgs.push('-H', rawArgs[i + 1] || '0.0.0.0');
    i++;
  } else if (!arg.startsWith('-')) {
    // Abaikan parameter posisional yang tidak dikenal
  }
}

if (!hasPort) {
  finalArgs.push('-p', '3000');
}
if (!hasHost) {
  finalArgs.push('-H', '0.0.0.0');
}

const child = spawn(process.execPath, [nextBin, ...finalArgs], {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

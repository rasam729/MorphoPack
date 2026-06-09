const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT, 'frontend');
const ENGINE_DIR = path.join(ROOT, 'MorphoPackEngine');
const ENV_FILE = path.join(ROOT, '.env');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');
const VENV_DIR = path.join(ROOT, '.venv');

function run(command, options = {}) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', ...options });
}

function safeRun(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options }).trim();
  } catch {
    return null;
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function loadEnv(filePath) {
  if (!fileExists(filePath)) {
    return {};
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const data = {};
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const pos = trimmed.indexOf('=');
    if (pos < 0) return;
    const key = trimmed.slice(0, pos).trim();
    const value = trimmed.slice(pos + 1);
    data[key] = value;
  });
  return data;
}

function writeEnv(filePath, updates) {
  const lines = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
    : [];

  const keys = Object.keys(updates);
  const output = [];
  const seen = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      output.push(line);
      continue;
    }
    const pos = line.indexOf('=');
    if (pos < 0) {
      output.push(line);
      continue;
    }
    const key = line.slice(0, pos).trim();
    if (updates.hasOwnProperty(key)) {
      output.push(`${key}=${updates[key]}`);
      seen.add(key);
    } else {
      output.push(line);
    }
  }

  for (const key of keys) {
    if (!seen.has(key)) {
      output.push(`${key}=${updates[key]}`);
    }
  }

  fs.writeFileSync(filePath, output.join('\n'), 'utf8');
}

function copyEnvExample() {
  if (!fileExists(ENV_FILE) && fileExists(ENV_EXAMPLE)) {
    fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
    console.log(`Created .env from .env.example`);
  }
}

function findLocalBlender() {
  const env = process.env.BLENDER_PATH && process.env.BLENDER_PATH.trim();
  if (env && fileExists(env)) {
    return env;
  }

  const platform = process.platform;
  const candidates = [];
  if (platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe',
      'C:\\Program Files (x86)\\Blender Foundation\\Blender 4.5\\blender.exe'
    );
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Blender.app/Contents/MacOS/Blender'
    );
  } else {
    candidates.push('/usr/bin/blender', '/usr/local/bin/blender');
  }

  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }

  const pathCommand = platform === 'win32' ? 'where blender' : 'which blender';
  const resolved = safeRun(pathCommand);
  if (resolved) {
    const first = resolved.split(/\r?\n/)[0];
    if (fileExists(first)) {
      return first;
    }
  }

  return null;
}

function findPython() {
  const candidates = [
    'python',
    'python3',
    'py -3'
  ];
  for (const candidate of candidates) {
    const version = safeRun(`${candidate} --version`);
    if (version) {
      return candidate;
    }
  }
  return null;
}

function dockerCliAvailable() {
  return Boolean(safeRun('docker --version'));
}

function dockerDaemonAvailable() {
  return Boolean(safeRun('docker info'));
}

function prepareFrontend() {
  if (!fileExists(FRONTEND_DIR)) {
    console.warn('Frontend directory not found, skipping frontend install.');
    return;
  }
  console.log('Installing frontend dependencies...');
  run(`npm install --prefix "${FRONTEND_DIR}"`);
}

function prepareBackend() {
  console.log('Preparing backend environment...');
  const python = findPython();
  if (!python) {
    console.warn('Python not found in PATH; skipping backend dependency install.');
    return;
  }

  if (!fileExists(VENV_DIR)) {
    console.log('Creating Python virtual environment at .venv');
    run(`${python} -m venv "${VENV_DIR}"`);
  }

  const pipPath = process.platform === 'win32'
    ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
    : path.join(VENV_DIR, 'bin', 'pip');

  if (!fileExists(pipPath)) {
    console.warn(`pip not found in virtual environment at ${pipPath}. Using python -m pip instead.`);
    run(`${python} -m pip install --upgrade pip`);
    run(`${python} -m pip install -r "${path.join(ENGINE_DIR, 'requirements.txt')}"`);
  } else {
    run(`"${pipPath}" install --upgrade pip`);
    run(`"${pipPath}" install -r "${path.join(ENGINE_DIR, 'requirements.txt')}"`);
  }
}

function buildDockerEngine() {
  if (!dockerCliAvailable()) {
    console.warn('Docker CLI not available; skipping Docker build.');
    return;
  }

  console.log('Building Docker engine container...');
  try {
    run('docker compose -f "MorphoPackEngine/docker-compose.yml" build');
    console.log('Docker engine built successfully.');
  } catch (error) {
    console.warn('Docker build failed. Docker may not be running or available:', error.message || error);
  }
}

function main() {
  console.log('Running MorphoPack bootstrap...');
  copyEnvExample();

  const env = loadEnv(ENV_FILE);
  const currentPath = env.BLENDER_PATH && env.BLENDER_PATH.trim();
  const blenderPath = currentPath && fileExists(currentPath) ? currentPath : findLocalBlender();

  if (blenderPath) {
    console.log(`Found local Blender executable: ${blenderPath}`);
    writeEnv(ENV_FILE, { BLENDER_PATH: blenderPath });
    console.log('.env updated with BLENDER_PATH');
    prepareFrontend();
    prepareBackend();
  } else {
    console.warn('Local Blender executable not found. Docker fallback is available.');
    if (dockerCliAvailable()) {
      console.log('Docker CLI detected. Attempting to build engine container...');
      buildDockerEngine();
    } else {
      console.warn('Docker CLI not available. Please install Blender locally or Docker to use the backend.');
    }
    prepareFrontend();
  }

  console.log('\nBootstrap complete.');
  if (blenderPath) {
    console.log('Run the backend with: python MorphoPackEngine/server.py');
  } else if (dockerCliAvailable()) {
    console.log('Run the backend with: npm run docker:up');
  }
}

main();

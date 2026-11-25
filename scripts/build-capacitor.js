const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const backupRoot = path.join(rootDir, '.tmp-capacitor-backup');
const apiBackupDir = path.join(backupRoot, 'api');
const outDir = path.join(rootDir, 'out');
const nextDir = path.join(rootDir, '.next');

function moveDirSafe(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  fs.rmSync(src, { recursive: true, force: true });
  return true;
}

function restoreApi() {
  if (fs.existsSync(apiBackupDir)) {
    fs.mkdirSync(path.dirname(apiDir), { recursive: true });
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.cpSync(apiBackupDir, apiDir, { recursive: true });
    fs.rmSync(backupRoot, { recursive: true, force: true });
    console.log('✅ Restored src/app/api cleanly.');
  }
}

process.on('SIGINT', () => {
  restoreApi();
  process.exit(1);
});

function loadEnvFiles(dir, filenames) {
  const loaded = {};
  for (const name of filenames) {
    const filePath = path.join(dir, name);
    if (!fs.existsSync(filePath)) continue;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      loaded[key] = val;
    }
  }
  return loaded;
}

const fileEnv = loadEnvFiles(rootDir, ['.env', '.env.local']);
const bundledGeminiKey = (
  process.env.NEXT_PUBLIC_CAPACITOR_GEMINI_KEY ||
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  fileEnv.GOOGLE_AI_API_KEY ||
  fileEnv.GEMINI_API_KEY ||
  ''
).trim();
const bundledGeminiModel = (
  process.env.NEXT_PUBLIC_CAPACITOR_GEMINI_MODEL ||
  process.env.GEMINI_MODEL ||
  fileEnv.GEMINI_MODEL ||
  ''
).trim();

const buildEnv = {
  ...process.env,
  CAPACITOR_BUILD: 'true',
  NEXT_PUBLIC_CAPACITOR_LOCAL: 'true',
  NEXT_PUBLIC_CAPACITOR_GEMINI_KEY: bundledGeminiKey,
  NEXT_PUBLIC_CAPACITOR_GEMINI_MODEL: bundledGeminiModel,
  DATABASE_URL: process.env.DATABASE_URL || fileEnv.DATABASE_URL || 'file:./dev.db',
  AUTH_SECRET:
    process.env.AUTH_SECRET ||
    fileEnv.AUTH_SECRET ||
    'nutrimentor-local-capacitor-fallback-key',
};

console.log('🔑 Bundled Gemini API key for APK:', bundledGeminiKey ? 'configured' : 'not set');

let apiMoved = false;

try {
  // Recover from any leftover backup if a prior run crashed
  if (fs.existsSync(apiBackupDir) && !fs.existsSync(apiDir)) {
    restoreApi();
  }

  console.log('🧹 Cleaning previous static output and .next cache...');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.rmSync(nextDir, { recursive: true, force: true });

  console.log('📦 Temporarily staging src/app/api for static export...');
  apiMoved = moveDirSafe(apiDir, apiBackupDir);

  console.log('🚀 Building Next.js static export bundle (out/)...');
  execSync('npx next build', { stdio: 'inherit', cwd: rootDir, env: buildEnv });
} finally {
  if (apiMoved || fs.existsSync(apiBackupDir)) {
    restoreApi();
  }
}

console.log('🔄 Syncing static bundle into Capacitor Android project...');
execSync('npx cap sync android', { stdio: 'inherit', cwd: rootDir, env: process.env });

if (!process.argv.includes('--skip-gradle')) {
  console.log('🤖 Compiling Android Debug APK via Gradle...');
  const gradleCmd = process.platform === 'win32'
    ? 'gradlew.bat clean assembleDebug --no-daemon'
    : './gradlew clean assembleDebug --no-daemon';
  execSync(gradleCmd, {
    stdio: 'inherit',
    cwd: path.join(rootDir, 'android'),
    env: process.env,
  });

  const apkPath = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (fs.existsSync(apkPath)) {
    const sizeMb = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(2);
    console.log(`\n🎉 Local APK built successfully: ${apkPath} (${sizeMb} MB)`);
  }
}

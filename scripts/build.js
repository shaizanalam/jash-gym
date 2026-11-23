const { execSync } = require('child_process');

// Ensure DATABASE_URL has a valid fallback on serverless builders like Vercel
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'nutrimentor-prod-secret-key-32-chars-minimum';
}

console.log('🔧 [Build Script] DATABASE_URL is set:', process.env.DATABASE_URL);

try {
  console.log('📦 [Build Script] Syncing Prisma schema...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env: process.env });
} catch (err) {
  console.warn('⚠️ [Build Script] prisma db push encountered a warning, continuing to next build...');
}

console.log('🚀 [Build Script] Building Next.js production bundle...');
execSync('next build', { stdio: 'inherit', env: process.env });

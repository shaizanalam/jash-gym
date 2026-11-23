const fs = require('fs');
const zlib = require('zlib');

const data = fs.readFileSync('prisma/dev.db');
const b64 = zlib.gzipSync(data).toString('base64');

const content = `// Auto-generated embedded fallback of seeded SQLite DB
import zlib from "zlib"
import fs from "fs"

const B64 = ${JSON.stringify(b64)}

export function restoreFallbackDb(targetPath: string): boolean {
  try {
    const buf = Buffer.from(B64, "base64")
    const decompressed = zlib.gunzipSync(buf)
    fs.writeFileSync(targetPath, decompressed)
    return true
  } catch (e) {
    console.error("[Prisma] Error restoring fallback db:", e)
    return false
  }
}
`

fs.writeFileSync('src/lib/db-seed-fallback.ts', content)
console.log('Successfully written src/lib/db-seed-fallback.ts')

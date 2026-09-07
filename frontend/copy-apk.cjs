const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'android/app/build/outputs/apk/debug/app-debug.apk');
const destPublic = path.join(__dirname, 'public/download/mivor-latest.apk');
const destBackend = path.join(__dirname, '../backend/downloads/mivor-latest.apk');

if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(destPublic), { recursive: true });
  fs.copyFileSync(src, destPublic);
  fs.mkdirSync(path.dirname(destBackend), { recursive: true });
  fs.copyFileSync(src, destBackend);
  const sizeMb = (fs.statSync(destPublic).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ [Auto-Copy APK] Copiado exitosamente (${sizeMb} MB) a:\n   - frontend/public/download/mivor-latest.apk\n   - backend/downloads/mivor-latest.apk`);
} else {
  console.warn('⚠️ No se encontró app-debug.apk en:', src);
}

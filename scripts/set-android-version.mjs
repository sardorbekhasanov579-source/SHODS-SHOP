import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(version)) throw Error('INVALID_APP_VERSION');
const [major,minor,patch] = version.split('.').map(Number);
// Monotonic Android versionCode. Max is < 1,000,000 for the supported semver range.
const versionCode = major * 10000 + minor * 100 + patch;
const gradleFile = path.join(root, 'android', 'app', 'build.gradle');
if (!fs.existsSync(gradleFile)) throw Error('Android build.gradle not found. Run: npx cap add android');
const source = fs.readFileSync(gradleFile, 'utf8');
if (!/\bversionCode\s+\d+/.test(source) || !/\bversionName\s+["'][^"']+["']/.test(source)) {
  throw Error('ANDROID_GRADLE_VERSION_FIELDS_MISSING');
}
let result = source.replace(/\bversionCode\s+\d+/,`versionCode ${versionCode}`);
result = result.replace(/\bversionName\s+["'][^"']+["']/,`versionName "${version}"`);
if (result !== source) fs.writeFileSync(gradleFile, result, 'utf8');
console.log(`SHODS SHOP Android: versionName=${version}, versionCode=${versionCode}`);
console.log('Muhim: oldingi APK ustiga o\u2018rnatish uchun ikkala APK bir xil imzo kaliti bilan imzolangan bo\u2018lishi shart.');

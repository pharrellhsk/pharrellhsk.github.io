import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.IMAGE_ROOT || 'image');
const output = path.join(root, 'manifest.json');
const baseUrl = 'https://pharrellhsk.github.io/image/';
const extensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
}

function encodePath(value) {
  return value.split(path.sep).map(encodeURIComponent).join('/');
}

walk(root);
files.sort((left, right) => left.localeCompare(right, 'zh-CN'));
const characters = {};

for (const file of files) {
  const relative = path.relative(root, file);
  const parts = relative.split(path.sep);
  if (parts.length < 3 || !['头像', '立绘'].includes(parts[1])) continue;
  const [name, folder] = parts;
  const label = path.basename(file, path.extname(file)).replace(new RegExp(`^${name}-`), '');
  const url = new URL(encodePath(relative), baseUrl).href;
  const character = characters[name] || { portraits: [], portraitLabels: [] };
  if (folder === '头像' && !character.avatar) character.avatar = url;
  if (folder === '立绘') {
    character.portraits.push(url);
    character.portraitLabels.push(label || '立绘');
  }
  characters[name] = character;
}

const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), baseUrl, characters };
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.info(`Generated manifest for ${Object.keys(characters).length} characters from ${files.length} images.`);

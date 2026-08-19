/* eslint-env node */
/* global __dirname */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const statePath = process.argv[2] || '/tmp/jahatelo-ios-release/.jahatelo-build-state.json';
const buildInfoPath = path.join(projectRoot, 'constants', 'appBuild.js');

const now = new Date();
const datePrefix = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
].join('.');

let previous = { nativeBuild: 1, label: '' };
if (fs.existsSync(statePath)) {
  try {
    previous = { ...previous, ...JSON.parse(fs.readFileSync(statePath, 'utf8')) };
  } catch {
    // Un estado local inválido solo reinicia el contador de la siguiente build.
  }
}

const source = fs.readFileSync(buildInfoPath, 'utf8');
const sourceLabel = source.match(/export const APP_BUILD = '([^']+)';/)?.[1] || '';
if (!previous.label) previous.label = sourceLabel;

const previousSequence = previous.label.startsWith(`${datePrefix}.`)
  ? Number(previous.label.split('.').at(-1)) || 0
  : 0;
const label = `${datePrefix}.${previousSequence + 1}`;
const nativeBuild = Number(previous.nativeBuild) + 1;

fs.mkdirSync(path.dirname(statePath), { recursive: true });
fs.writeFileSync(statePath, JSON.stringify({ nativeBuild, label }, null, 2));

const updated = source.replace(
  /export const APP_BUILD = '[^']+';/,
  `export const APP_BUILD = '${label}';`,
);

if (updated === source) {
  throw new Error('No se pudo actualizar APP_BUILD en constants/appBuild.js');
}

fs.writeFileSync(buildInfoPath, updated);
process.stdout.write(`${nativeBuild}|${label}`);

const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, 'SISTEMA_JAHATELO.md');
const output = path.join(__dirname, 'SISTEMA_JAHATELO.html');
const source = fs.readFileSync(input, 'utf8');

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const inline = (value) => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

const lines = source.split('\n');
let html = '';
let inCode = false;
let inTable = false;
let tableRows = [];
let listType = null;

const closeList = () => {
  if (listType) html += `</${listType}>`;
  listType = null;
};

const flushTable = () => {
  if (!inTable) return;
  const rows = tableRows.filter((row) => !/^\|?\s*:?-{3,}/.test(row.replaceAll('|', '').trim()));
  if (rows.length) {
    const [header, ...body] = rows;
    const cells = (row, tag) => row.split('|').slice(1, -1)
      .map((cell) => `<${tag}>${inline(cell.trim())}</${tag}>`).join('');
    html += `<table><thead><tr>${cells(header, 'th')}</tr></thead><tbody>`;
    html += body.map((row) => `<tr>${cells(row, 'td')}</tr>`).join('');
    html += '</tbody></table>';
  }
  inTable = false;
  tableRows = [];
};

for (const line of lines) {
  if (line.startsWith('```')) {
    closeList();
    flushTable();
    html += inCode ? '</code></pre>' : '<pre><code>';
    inCode = !inCode;
    continue;
  }
  if (inCode) {
    html += `${escapeHtml(line)}\n`;
    continue;
  }
  if (line.startsWith('|')) {
    closeList();
    inTable = true;
    tableRows.push(line);
    continue;
  }
  flushTable();
  const heading = line.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
    closeList();
    const level = heading[1].length;
    html += `<h${level}>${inline(heading[2])}</h${level}>`;
    continue;
  }
  if (/^---+$/.test(line.trim())) {
    closeList();
    html += '<hr>';
    continue;
  }
  const ordered = line.match(/^\d+\.\s+(.+)$/);
  const unordered = line.match(/^-\s+(.+)$/);
  if (ordered || unordered) {
    const nextType = ordered ? 'ol' : 'ul';
    if (listType !== nextType) {
      closeList();
      listType = nextType;
      html += `<${listType}>`;
    }
    html += `<li>${inline((ordered || unordered)[1])}</li>`;
    continue;
  }
  closeList();
  if (line.trim()) html += `<p>${inline(line)}</p>`;
}

closeList();
flushTable();

const page = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Documentacion tecnica integral — Jahatelo</title>
<style>
@page { size: A4; margin: 18mm 16mm; }
body { color:#172033; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size:10pt; line-height:1.45; }
h1 { color:#6117c9; font-size:25pt; line-height:1.15; margin:0 0 12pt; }
h2 { color:#6117c9; font-size:16pt; margin:26pt 0 9pt; page-break-after:avoid; border-bottom:1px solid #ded4ef; padding-bottom:4pt; }
h3 { color:#4d247f; font-size:12pt; margin:16pt 0 6pt; page-break-after:avoid; }
p { margin:0 0 7pt; } strong { color:#2d1745; } code { background:#f3eff8; color:#4d247f; padding:1pt 3pt; border-radius:3pt; font-family:Menlo, monospace; font-size:8.5pt; }
pre { background:#171321; color:#f8f5ff; padding:9pt; border-radius:5pt; white-space:pre-wrap; font-size:8pt; }
table { width:100%; border-collapse:collapse; margin:8pt 0 12pt; font-size:8.5pt; page-break-inside:avoid; } th { background:#6921cb; color:white; text-align:left; } th, td { border:1px solid #ddd4eb; padding:5pt; vertical-align:top; } tr:nth-child(even) { background:#faf8fc; }
ul,ol { margin:3pt 0 8pt; padding-left:18pt; } li { margin:2pt 0; } hr { border:0; border-top:2px solid #8e2de2; margin:18pt 0; }
</style></head><body>${html}</body></html>`;

fs.writeFileSync(output, page);
console.log(output);

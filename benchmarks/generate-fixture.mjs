import { writeFile } from 'node:fs/promises';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="96" viewBox="0 0 128 96"><rect width="128" height="96" fill="#123456"/><circle cx="32" cy="32" r="24" fill="#e67e22"/><path d="M0 80h128v16H0z" fill="#2ecc71"/><text x="8" y="72" font-family="sans-serif" font-size="14" fill="#ffffff">fixture-128x96</text></svg>\n`;
await writeFile(new URL('./fixture-128x96.svg', import.meta.url), svg, 'utf8');

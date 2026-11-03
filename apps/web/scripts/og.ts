// One-off generator for public/og.png (1200x630). Run: pnpm exec tsx scripts/og.ts
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const font = (file: string) =>
  `url(data:font/woff2;base64,${readFileSync(`node_modules/@fontsource/${file}`).toString('base64')})`;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <style>
      @font-face { font-family: Inter; font-weight: 800; src: ${font('inter/files/inter-latin-800-normal.woff2')}; }
      @font-face { font-family: Inter; font-weight: 500; src: ${font('inter/files/inter-latin-500-normal.woff2')}; }
      @font-face { font-family: 'Space Grotesk'; font-weight: 700; src: ${font('space-grotesk/files/space-grotesk-latin-700-normal.woff2')}; }
    </style>
    <radialGradient id="g" cx="80%" cy="20%" r="60%">
      <stop offset="0" stop-color="#14B8A6" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#0A0E14" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.09)"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#0A0E14"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(80 80)">
    <rect width="64" height="64" rx="14" fill="#14B8A6"/>
    <rect x="15" y="14" width="9" height="36" rx="2.5" fill="#0A0E14"/>
    <polyline points="31,22 45,32 31,42" fill="none" stroke="#0A0E14" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="84" y="46" font-family="Inter" font-size="34" fill="#F1F4F8"><tspan font-weight="800">BRX</tspan><tspan font-weight="500" dx="10">Solutions</tspan></text>
  </g>
  <text x="80" y="330" font-family="'Space Grotesk'" font-weight="700" font-size="88" letter-spacing="-3.5" fill="#F1F4F8">Back-end a AI,</text>
  <text x="80" y="420" font-family="'Space Grotesk'" font-weight="700" font-size="88" letter-spacing="-3.5" fill="#F1F4F8">ktoré bežia v produkcii.</text>
  <text x="80" y="520" font-family="Inter" font-weight="500" font-size="28" fill="#AEB8C6">Python · TypeScript · RAG · LLM pipelines · brxsolutions.sk</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('wrote public/og.png');

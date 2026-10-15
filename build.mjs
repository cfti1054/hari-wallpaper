// src/ + assets/character.glb → index.html 하나로 묶기 (모델·3D 엔진 포함, 인터넷 없이 동작)
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const res = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, write: false, logLevel: 'warning' });
const js = res.outputFiles[0].text;
if (js.toLowerCase().includes('</script')) throw new Error('번들 안에 </script 문자열이 있어 HTML에 넣을 수 없습니다');
const glb = readFileSync('assets/character.glb').toString('base64');
const shell = readFileSync('src/shell.html', 'utf8');

const body = `${shell}\n<script>window.CHAR_GLB_B64="${glb}";</script>\n<script>${js}</script>\n`;
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${body.replace('<div class="hint"', '</head>\n<body>\n<div class="hint"')}</body>
</html>
`;
writeFileSync('index.html', html);
console.log(`index.html 생성 완료 (${Math.round(html.length / 1024)} KB)`);

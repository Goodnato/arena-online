'use strict';
/* Gera os arquivos do online a partir do jogo.html (que continua sendo a única fonte das regras):
     servidor/jogo-logica.js  -> regras dos 7 modos, rodadas pelo servidor num sandbox (vm)
     publico/index.html       -> cliente: fonte/ (cabeca.html, css-lobby.css, cliente-online.js) + desenho e regras do jogo.html
   Rode de novo (node montar.js) sempre que mudar o jogo.html ou fonte/ (cabeca.html, css-lobby.css, cliente-online.js). */
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(RAIZ, 'jogo.html'), 'utf8').split('\n');

const achar = (re, de = 0) => { const i = html.findIndex((l, n) => n >= de && re.test(l)); if (i < 0) throw new Error('não achei ' + re); return i; };
const iLogIni = achar(/^\s+CONSTANTES\s*$/) - 1;                       // linha "/* ====" antes de CONSTANTES
const iLogFim = achar(/^\/\/ Só visual: desliza o boneco/);             // fim da lógica (depois de MODOS)
const iAtualizar = achar(/^function atualizar\(dt\) \{/, iLogFim);      // atualizar() offline: não entra no cliente
const iRendIni = achar(/^\s+RENDERIZAÇÃO/) - 1;
const iRendFim = achar(/^\s+LOOP PRINCIPAL/) - 1;

let logica = html.slice(iLogIni, iLogFim).join('\n');
const efeitos = html.slice(iLogFim, iAtualizar).join('\n');
let render = html.slice(iRendIni, iRendFim).join('\n');

// Os ouvintes de teclado/toque do jogo offline não podem existir no online
const ouvintes = /^window\.addEventListener\('(keydown|keyup|touchstart|touchmove)'[\s\S]*?^\}(, \{ passive: (true|false) \})?\);$/gm;
const ouvintes1 = /^window\.addEventListener\('(touchend|touchcancel)', soltarDedo\);$/gm;
logica = logica.replace(ouvintes, '').replace(ouvintes1, '');

function trocar(texto, de, para, nome) {
  if (!texto.includes(de)) throw new Error('trecho não encontrado (' + nome + '): ' + de.slice(0, 60));
  return texto.split(de).join(para);
}

/* ---------- servidor ---------- */
fs.writeFileSync(path.join(__dirname, 'jogo-logica.js'), logica + '\n');

/* ---------- cliente: ajustes no desenho (apelidos, emotes, rodapé) ---------- */
render = trocar(render, "  for (const p of estado.jogadores) if (p.morto <= 0) desenharJogador(p, T);",
  "  for (const p of estado.jogadores) if (p.morto <= 0) desenharJogador(p, T);\n  desenharEmotes(T);", 'emotes');
render = trocar(render, "  const w = ctx.measureText(p.num).width + tam * .9, h = tam * 1.25;",
  "  const etq = humano ? String(p.nome || p.num).slice(0, 10) : String(p.num);\n  const w = ctx.measureText(etq).width + tam * .9, h = tam * 1.25;", 'etiqueta');
render = trocar(render, "ctx.fillText(p.num, cx, ty + 1);",
  "ctx.fillText(etq, cx, ty + 1);\n  if (p.num === euNum) { const sy = ty - h / 2 - 4 - Math.abs(Math.sin(agoraS * 5)) * 4, s = T * .15; ctx.fillStyle = DOURADO; ctx.beginPath(); ctx.moveTo(cx - s, sy - s); ctx.lineTo(cx + s, sy - s); ctx.lineTo(cx, sy); ctx.closePath(); ctx.fill(); }", 'marca');
render = trocar(render, "`Jogador ${f.vn}`", "nomeDe(f.vn)", 'feed vn');
render = trocar(render, "`Jogador ${f.an}`", "nomeDe(f.an)", 'feed an');
render = trocar(render, "`Jogador ${p.num} volta em ", "`${p.nome || p.num} volta em ", 'rodape volta');
render = trocar(render, "`Jogador ${p.num} eliminado`", "`${p.nome || p.num} eliminado`", 'rodape elim');
render = trocar(render, "`Bots: ${N().nome}  ·  Som: ${somLigado ? 'ligado' : 'desligado'}  ·  Música: ${musicaLigada ? 'ligada' : 'desligada'}`",
  "`Bots: ${N().nome}  ·  Som: ${somLigado ? 'ligado' : 'desligado'} (V)`", 'rodape opcoes');

const lerFonte = n => fs.readFileSync(path.join(RAIZ, 'fonte', n), 'utf8');
const modelo = lerFonte('cabeca.html') + lerFonte('css-lobby.css') + lerFonte('cliente-online.js') + '</script>\n</body>\n</html>\n';
if (!modelo.includes('/*@@JOGO@@*/')) throw new Error('marcador @@JOGO@@ ausente em css-lobby.css');
const jogo = '/* ===== Trechos do jogo.html (gerados por servidor/montar.js; não edite aqui) ===== */\n' +
  logica + '\n' + efeitos + '\n' + render + '\n/* ===== fim dos trechos do jogo.html ===== */\n';
fs.writeFileSync(path.join(RAIZ, 'publico', 'index.html'), modelo.replace('/*@@JOGO@@*/', () => jogo));
console.log('ok: jogo-logica.js (' + logica.split('\n').length + ' linhas) e publico/index.html gerados');

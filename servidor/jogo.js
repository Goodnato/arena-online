'use strict';
/* Roda a lógica REAL do jogo.html (servidor/jogo-logica.js, gerado por montar.js) dentro de um sandbox (vm),
   uma partida por sandbox. O que era tela/som vira evento; o estado é mandado ao cliente em "snapshots". */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const SCRIPT = new vm.Script(fs.readFileSync(path.join(__dirname, 'jogo-logica.js'), 'utf8'), { filename: 'jogo-logica.js' });
const NIVEL_IDX = { facil: 0, medio: 1, dificil: 2 };
const MODOS_EQUIPE = { times: true, band: true, rev: true };
const MODOS_LISTA = ['times', 'ouro', 'rei', 'pega', 'sob', 'band', 'rev'];

// Código que roda DENTRO do sandbox, depois da lógica do jogo
const EXTRA = `
const __EXC = new Set(['particulas','textos','confete','feed','anuncio','aviso','flash','tremor','festa','reinicio','jogadores','contagemNum','vai']);
const __CAMPOS = ['x','y','morto','tempoRenascer','pontos','dourado','bandeira','tempoColina','tempoOuro','tempoElim','abates','capturas','sequencia'];
function __rep(k, v) {
  if (typeof v === 'number' && !isFinite(v)) return { __n: String(v) };
  if (v && typeof v === 'object' && v.num !== undefined && v.controle !== undefined && estado.jogadores.includes(v)) return { __p: v.num };
  return v;
}
function __chaves() { const o = {}; for (const k in estado) if (!__EXC.has(k)) o[k] = JSON.stringify(estado[k], __rep); return o; }
function __jogadores() {
  return JSON.stringify(estado.jogadores.map(p => { const o = { n: p.num, b: p.controle === 'bot' ? 1 : 0, d: p.dir }; for (const c of __CAMPOS) o[c] = p[c]; return o; }), __rep);
}
function __mapa() { return JSON.stringify(MAPA); }
function __tick(dt) {
  if (estado.contagem > 0) { estado.contagem -= dt; return; }
  if (!estado.vencedor) { estado.tempo += dt; atualizarJogadores(dt); M().atualizar(dt); }
}
function __dir(i, cod) { const h = 'h' + i; segurando[h] = []; apertarDirecao(h, cod); }
function __solta(i) { segurando['h' + i] = []; }
function __virarBot(i) { ehBot[i - 1] = true; estado.jogadores[i - 1].controle = 'bot'; }
function __virarHumano(i) { ehBot[i - 1] = false; estado.jogadores[i - 1].controle = 'h' + i; }
function __flash() { if (estado.flash && estado.flash.t > 0) { const f = { t: estado.flash.t, cor: estado.flash.cor }; estado.flash.t = 0; return f; } return null; }
function __placar() { return JSON.stringify(placar); }
function __estado() { return { vencedor: estado.vencedor, contagem: estado.contagem }; }
`;

/* slots: 6 itens { bot: bool, nome: string }, na ordem dos jogadores do modo */
function criarPartida({ modo, nivel, slots, placar }) {
  const eventos = [];
  const els = {};
  const el = id => els[id] || (els[id] = { id, style: {}, textContent: '', innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, blur() {} });
  const sandbox = {
    console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {},
    document: { getElementById: el, querySelector: el, documentElement: el('_raiz'), body: el('_corpo'), addEventListener() {}, fullscreenElement: null },
    window: { matchMedia: () => ({ matches: false }), addEventListener() {} },
    localStorage: { getItem: () => null, setItem() {} },
    performance: { now: () => Date.now() }, requestAnimationFrame() {},
    __emit: e => eventos.push(e),
  };
  vm.createContext(sandbox);
  SCRIPT.runInContext(sandbox);
  const run = c => vm.runInContext(c, sandbox);
  run(EXTRA);
  // efeitos de tela e som viram eventos para o cliente repetir
  run(`
    textoFlutuante = (...a) => __emit({ k: 'tf', a });
    criarEfeito = (...a) => __emit({ k: 'ef', a });
    tremer = t => __emit({ k: 'tr', t });
    anunciar = (texto, cor) => __emit({ k: 'an', texto, cor });
    mostrarAviso = texto => __emit({ k: 'av', texto });
    soltarConfete = n => __emit({ k: 'conf', n });
    tocarMusica = () => {}; audio = () => null; tom = () => {};
    for (const k of Object.keys(SONS)) { const nome = k; SONS[k] = (...a) => __emit({ k: 'som', n: nome, a }); }
    { const orig = eliminar; eliminar = function (v, a) { __emit({ k: 'elim', an: a ? a.num : null, at: a ? a.time : null, vn: v.num, vt: v.time }); return orig(v, a); }; }
  `);
  run(`
    modo = ${JSON.stringify(modo)}; nivel = ${NIVEL_IDX[nivel] ?? 1}; iniciado = true;
    placar = ${JSON.stringify(placar || { azul: 0, vermelho: 0 })};
    CONFIG_JOGADORES = MODOS[modo].jogadores.map((c, i) => ({ time: c.time, controle: 'h' + (i + 1) }));
    ehBot = ${JSON.stringify(slots.map(s => !!s.bot))};
    for (let i = 1; i <= 6; i++) { TECLAS['h' + i] = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }; segurando['h' + i] = []; }
    iniciarPartida();
  `);
  const nomes = slots.map(s => s.nome);
  const info = () => sandbox.__estado();
  const jogo = {
    modo, nomes, vencedor: null, contagem: 3, fimEnviado: false,
    ultimas: {}, ultimoMapa: '',
    atualizar(dt) {
      if (this.vencedor) return;
      sandbox.__tick(dt);
      const i = info(); this.vencedor = i.vencedor; this.contagem = i.contagem;
      const f = sandbox.__flash(); if (f) eventos.push({ k: 'flash', t: f.t, cor: f.cor });
      if (this.vencedor && !this.fimEnviado) {
        this.fimEnviado = true;
        const nome = html => html.replace(/Jogador (\d+)/g, (m, n) => esc(nomes[n - 1] || m));
        eventos.push({
          k: 'fim', vencedor: this.vencedor, texto: nome(els.fimTexto.textContent), cor: els.fimTexto.style.color, sombra: els.fimTexto.style.textShadow,
          placar: nome(els.fimPlacar.innerHTML), stats: nome(els.fimStats.innerHTML), placarObj: JSON.parse(sandbox.__placar()),
        });
      }
    },
    direcao(slot, dir, soltou) {
      if (soltou || !dir) { sandbox.__solta(slot); return; }
      const cod = dir[0] === 1 ? 'R' : dir[0] === -1 ? 'L' : dir[1] === 1 ? 'D' : 'U';
      sandbox.__dir(slot, cod);
    },
    virarBot(slot) { sandbox.__virarBot(slot); },
    virarHumano(slot) { sandbox.__virarHumano(slot); },
    pegarEventos() { const e = eventos.slice(); eventos.length = 0; return e; },
    placarAtual() { return JSON.parse(sandbox.__placar()); },
    // Snapshot como texto JSON. completo=false: só as chaves do estado que mudaram desde o último envio
    snapshot(completo) {
      const chaves = sandbox.__chaves();
      const mud = [];
      for (const k in chaves) if (completo || this.ultimas[k] !== chaves[k]) { mud.push(JSON.stringify(k) + ':' + chaves[k]); if (!completo) this.ultimas[k] = chaves[k]; }
      const mapa = sandbox.__mapa(); let m = '';
      if (completo || mapa !== this.ultimoMapa) { m = ',"m":' + mapa; if (!completo) this.ultimoMapa = mapa; }
      return '{"t":"snap","j":' + sandbox.__jogadores() + m + ',"e":{' + mud.join(',') + '}}';
    },
    inicio(extra) { return { modo, nivel, nomes, slots: slots.map((s, i) => ({ n: i + 1, bot: !!s.bot, nome: s.nome })), ...extra }; },
  };
  return jogo;
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = { criarPartida, MODOS_EQUIPE, MODOS_LISTA };

'use strict';
/* Servidor do Arena online (Times 3x3): várias salas, privadas (código/link) e públicas (jogar rápido).
   Serve os arquivos da pasta ../publico e fala WebSocket no mesmo endereço. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { criarPartida, MODOS_EQUIPE, MODOS_LISTA } = require('./jogo.js');
const NIVEIS = { facil: 1, medio: 1, dificil: 1 };

const PORTA = process.env.PORT || 3000;
const PUBLICO = path.join(__dirname, '..', 'publico');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon' };

const http_ = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const arq = path.normalize(path.join(PUBLICO, url));
  if (!arq.startsWith(PUBLICO)) { res.writeHead(403); return res.end(); }
  fs.readFile(arq, (err, dados) => {
    if (err) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Cache-Control': 'no-cache', 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
    res.end(dados);
  });
});

/* ---------- Salas ---------- */
const MAX_POR_TIME = 3, MAX_SALA = MAX_POR_TIME * 2, MAX_SALAS = 200;
const salas = new Map();           // código -> sala
const conexoes = new Set();
const reservas = new Map();        // token -> vaga guardada de quem caiu no meio da partida
const TEMPO_RESERVA = 30000, TEMPO_AFK = +process.env.ARENA_AFK || 25000;
let proximoId = 1;

const enviar = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };
const todos = (sala, obj) => { const s = JSON.stringify(obj); for (const c of sala.clientes.values()) if (c.ws.readyState === 1) c.ws.send(s); };

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function novoCodigo() {
  for (;;) {
    let c = ''; for (let i = 0; i < 4; i++) c += LETRAS[Math.floor(Math.random() * LETRAS.length)];
    if (!salas.has(c)) return c;
  }
}
function criarSala(publica) {
  const sala = { codigo: novoCodigo(), publica: !!publica, clientes: new Map(), dono: null, nivel: 'medio', modo: 'times', placar: { azul: 0, vermelho: 0 }, jogo: null, fimEm: 0 };
  salas.set(sala.codigo, sala);
  return sala;
}

function nomeLimpo(sala, txt, id) {
  let n = String(txt || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 12) || `Jogador${id}`;
  const usados = new Set([...sala.clientes.values()].map(c => c.nome));
  if (usados.has(n)) { let k = 2; while (usados.has(`${n}${k}`)) k++; n = `${n}${k}`; }
  return n;
}
function timeComVaga(sala) {
  const cont = { azul: 0, vermelho: 0 };
  for (const c of sala.clientes.values()) cont[c.time]++;
  return cont.azul <= cont.vermelho ? 'azul' : 'vermelho';
}
function estadoSala(sala) {
  return {
    t: 'sala', codigo: sala.codigo, publica: sala.publica, dono: sala.dono, nivel: sala.nivel, modo: sala.modo, emJogo: !!sala.jogo,
    jogadores: [...sala.clientes.entries()].map(([id, c]) => ({ id, nome: c.nome, time: c.time })),
  };
}

function entrarNaSala(c, sala) {
  if (sala.clientes.size >= MAX_SALA) return enviar(c.ws, { t: 'erro', msg: 'Sala cheia.' });
  c.sala = sala; c.vaga = null; c.nome = nomeLimpo(sala, c.nomePedido, c.id); c.time = timeComVaga(sala);
  sala.clientes.set(c.id, c);
  if (sala.dono === null) sala.dono = c.id;
  todos(sala, estadoSala(sala));
}

function sairDaSala(c) {
  const sala = c.sala; if (!sala) return;
  sala.clientes.delete(c.id);
  if (c.vaga && sala.jogo) sala.jogo.virarBot(c.vaga);     // o bot assume a vaga
  c.sala = null; c.vaga = null;
  if (!sala.clientes.size) { if (!temReserva(sala)) salas.delete(sala.codigo); return; }   // sala vazia some, a menos que alguém caído possa voltar
  const eraDono = sala.dono === c.id;
  if (eraDono) sala.dono = sala.clientes.keys().next().value;
  todos(sala, estadoSala(sala));
  todos(sala, { t: 'aviso', texto: `${c.nome} saiu da sala` });
  if (eraDono) todos(sala, { t: 'aviso', texto: `${sala.clientes.get(sala.dono).nome} agora é o dono da sala` });
}

function temReserva(sala) { for (const r of reservas.values()) if (r.sala === sala && r.expira > Date.now()) return true; return false; }
// Guarda a vaga de quem caiu no meio da partida (o bot assume; se voltar em 30 s, retoma)
function reservar(c) {
  if (c.token && c.sala && c.sala.jogo && c.vaga)
    reservas.set(c.token, { sala: c.sala, jogo: c.sala.jogo, vaga: c.vaga, nome: c.nome, time: c.time, expira: Date.now() + TEMPO_RESERVA });
}
function restaurar(c, r) {
  c.sala = r.sala; c.vaga = r.vaga; c.nome = r.nome; c.time = r.time; c.afk = false; c.ultimoInput = Date.now();
  r.sala.clientes.set(c.id, c);
  if (!r.sala.clientes.has(r.sala.dono)) r.sala.dono = c.id;
  r.jogo.virarHumano(r.vaga);
  enviar(c.ws, { t: 'inicio', ...r.jogo.inicio({ placar: r.sala.placar, voce: r.vaga }) });
  enviar(c.ws, JSON.parse(r.jogo.snapshot(true)));
  todos(r.sala, estadoSala(r.sala));
}
function listaPublica() {
  return [...salas.values()].filter(s => s.publica).slice(0, 20)
    .map(s => ({ codigo: s.codigo, n: s.clientes.size, max: MAX_SALA, emJogo: !!s.jogo, nivel: s.nivel, modo: s.modo }));
}

function jogarRapido() {
  let melhor = null;
  for (const s of salas.values()) {
    if (!s.publica || s.jogo || s.clientes.size >= MAX_SALA) continue;
    if (!melhor || s.clientes.size > melhor.clientes.size) melhor = s;
  }
  return melhor || criarSala(true);
}

function comecar(sala) {
  const modo = sala.modo, equipes = !!MODOS_EQUIPE[modo];
  const humanos = [...sala.clientes.values()];
  const slots = Array.from({ length: 6 }, (_, i) => ({ bot: true, nome: `Bot ${i + 1}`, cliente: null }));
  if (equipes) {                       // azul = vagas 1-3, vermelho = vagas 4-6
    const prox = { azul: 0, vermelho: 3 }, limite = { azul: 3, vermelho: 6 };
    for (const c of humanos) if (prox[c.time] < limite[c.time]) { slots[prox[c.time]++] = { bot: false, nome: c.nome, cliente: c }; }
  } else humanos.slice(0, 6).forEach((c, i) => { slots[i] = { bot: false, nome: c.nome, cliente: c }; });
  const jogo = criarPartida({ modo, nivel: sala.nivel, slots, placar: sala.placar });
  for (const c of sala.clientes.values()) c.vaga = null;
  slots.forEach((sl, i) => { if (sl.cliente) sl.cliente.vaga = i + 1; });
  sala.jogo = jogo; sala.fimEm = 0;
  for (const c of sala.clientes.values()) { c.afk = false; c.ultimoInput = Date.now() + 3000; }
  const ini = jogo.inicio({ placar: sala.placar });
  for (const c of sala.clientes.values()) enviar(c.ws, { t: 'inicio', ...ini, voce: c.vaga });
  todos(sala, estadoSala(sala));
}

function voltarParaSala(sala) {
  sala.jogo = null; sala.fimEm = 0;
  for (const c of sala.clientes.values()) c.vaga = null;
  todos(sala, estadoSala(sala));
}

// A partida roda a 30 passos por segundo; o estado vai aos jogadores a 15 por segundo (o cliente suaviza)
const DT = 1 / 30;
let ciclo = 0;
setInterval(() => {
  ciclo++;
  for (const sala of salas.values()) {
    const j = sala.jogo;
    if (!j) continue;
    j.atualizar(DT);
    if (j.contagem <= 0 && !j.vencedor) {
      const agora = Date.now();
      for (const c of sala.clientes.values()) if (c.vaga && !c.afk && agora - c.ultimoInput > TEMPO_AFK) {
        c.afk = true; j.virarBot(c.vaga); enviar(c.ws, { t: 'afk' });
      }
    }
    if (ciclo % 2 === 0) {
      const snap = j.snapshot(false);
      for (const c of sala.clientes.values()) if (c.ws.readyState === 1) c.ws.send(snap);
      const ev = j.pegarEventos();
      if (ev.length) {
        for (const e of ev) if (e.k === 'fim') sala.placar = e.placarObj;
        todos(sala, { t: 'ev', lista: ev });
      }
    }
    if (j.vencedor && !sala.fimEm) sala.fimEm = Date.now() + 9000;
    if (sala.fimEm && Date.now() > sala.fimEm) voltarParaSala(sala);
  }
}, 1000 / 30);

/* ---------- Conexões ---------- */
const wss = new WebSocketServer({ server: http_, maxPayload: 2048 });
setInterval(() => {              // batimento: derruba conexões mortas e limpa reservas vencidas
  for (const c of conexoes) { if (c.vivo === false) { c.ws.terminate(); continue; } c.vivo = false; try { c.ws.ping(); } catch (e) {} }
  const t = Date.now(); for (const [k, r] of reservas) if (r.expira < t) reservas.delete(k);
  for (const [cod, s] of salas) if (!s.clientes.size && !temReserva(s)) salas.delete(cod);
}, 10000);
wss.on('connection', ws => {
  const c = { ws, id: proximoId++, nomePedido: null, nome: '', time: 'azul', vaga: null, sala: null, token: null, vivo: true, afk: false, ultimoInput: 0, ultimoEmote: 0 };
  conexoes.add(c);
  ws.on('pong', () => { c.vivo = true; });
  ws.on('message', bruto => {
    let m; try { m = JSON.parse(bruto); } catch { return; }
    if (!m || typeof m.t !== 'string') return;

    if (m.t === 'entrar') {
      if (c.nomePedido !== null) return;
      c.nomePedido = m.nome;
      c.token = typeof m.token === 'string' && /^[A-Za-z0-9_-]{8,40}$/.test(m.token) ? m.token : null;
      let r = null;
      if (c.token) {
        // conexão antiga ainda "viva" (celular que trocou de rede): vira reserva e é derrubada
        const velho = [...conexoes].find(o => o !== c && o.token === c.token && o.sala);
        if (velho) { reservar(velho); sairDaSala(velho); velho.ws.terminate(); }
        const g = reservas.get(c.token);
        if (g && g.expira > Date.now() && salas.get(g.sala.codigo) === g.sala && g.sala.jogo === g.jogo && !g.jogo.vencedor) r = g;
        reservas.delete(c.token);
      }
      enviar(ws, { t: 'bemvindo', id: c.id, volta: !!r });
      if (r) restaurar(c, r);
      return;
    }
    if (c.nomePedido === null) return;

    if (!c.sala) {                      // ainda no menu
      if (m.t === 'criar') {
        if (salas.size >= MAX_SALAS) return enviar(ws, { t: 'erro', msg: 'Servidor cheio, tente mais tarde.' });
        entrarNaSala(c, criarSala(false));
      } else if (m.t === 'rapido') {
        if (salas.size >= MAX_SALAS && ![...salas.values()].some(s => s.publica && !s.jogo)) return enviar(ws, { t: 'erro', msg: 'Servidor cheio, tente mais tarde.' });
        entrarNaSala(c, jogarRapido());
      } else if (m.t === 'lista') {
        enviar(ws, { t: 'lista', salas: listaPublica() });
      } else if (m.t === 'codigo') {
        const sala = salas.get(String(m.codigo || '').toUpperCase().trim());
        if (!sala) return enviar(ws, { t: 'erro', msg: 'Sala não encontrada.' });
        entrarNaSala(c, sala);
      }
      return;
    }

    const sala = c.sala;
    if (m.t === 'dir' && sala.jogo && c.vaga) {
      const d = Array.isArray(m.d) && m.d.length === 2 ? m.d.map(v => Math.sign(+v) || 0) : null;
      if (d && Math.abs(d[0]) + Math.abs(d[1]) !== 1) return;
      if (c.afk) { c.afk = false; sala.jogo.virarHumano(c.vaga, c.nome); }   // voltou a mexer: deixa de ser bot
      c.ultimoInput = Date.now();
      sala.jogo.direcao(c.vaga, d, !!m.s);
    } else if (m.t === 'time' && !sala.jogo && (m.time === 'azul' || m.time === 'vermelho')) {
      const n = [...sala.clientes.values()].filter(x => x.time === m.time).length;
      if (n < MAX_POR_TIME) { c.time = m.time; todos(sala, estadoSala(sala)); }
    } else if (m.t === 'modo' && c.id === sala.dono && !sala.jogo && MODOS_LISTA.includes(m.modo)) {
      sala.modo = m.modo; todos(sala, estadoSala(sala));
    } else if (m.t === 'nivel' && c.id === sala.dono && !sala.jogo && NIVEIS[m.nivel]) {
      sala.nivel = m.nivel; todos(sala, estadoSala(sala));
    } else if (m.t === 'comecar' && c.id === sala.dono && !sala.jogo) {
      comecar(sala);
    } else if (m.t === 'emote') {
      const e = Math.floor(+m.e), agora = Date.now();
      if (!(e >= 0 && e < 4) || agora - c.ultimoEmote < 1200) return;
      c.ultimoEmote = agora;
      todos(sala, { t: 'emote', n: sala.jogo && c.vaga ? c.vaga : null, nome: c.nome, e });
    } else if (m.t === 'sair') {
      sairDaSala(c); enviar(ws, { t: 'menu' });
    }
  });
  ws.on('close', () => { reservar(c); sairDaSala(c); conexoes.delete(c); });
});

http_.listen(PORTA, () => console.log(`Arena online em http://localhost:${PORTA}`));

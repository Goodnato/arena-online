
/* =====================================================================
   ARENA ONLINE — parte do cliente. O servidor roda as regras (o mesmo código do jogo.html);
   aqui só chegam o estado e os eventos, e o desenho é o do jogo offline.
   ===================================================================== */
iniciado = true;                       // libera os sons (tom() fica mudo quando iniciado = false)
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ORDEM = ['times', 'ouro', 'rei', 'pega', 'sob', 'band', 'rev'];
const ICONES = { times: '🎯', ouro: '🏆', rei: '👑', pega: '🏃', sob: '🔥', band: '🚩', rev: '🔄' };
const DESCR = {
  times: 'Azul contra Vermelho. Capture os objetivos do meio para abrir o portão inimigo e tome a base deles. Pisar em um jogador o elimina.',
  ouro: 'Todos contra todos. Pegue o Ouro na caixa central, que abre e fecha, e leve até a sua base. Quem fizer 3 pontos vence.',
  rei: 'Todos contra todos. Fique sozinho na zona que muda de lugar e some 20 segundos para vencer. Pisar em um jogador o elimina.',
  pega: 'Todos contra todos. Segure o Ouro para somar tempo e pise em quem o carrega para roubá-lo. Quem somar 20 segundos vence.',
  sob: 'Todos contra todos, sem renascer. A borda da arena vai virando parede. O último vivo vence.',
  band: 'Azul contra Vermelho, 3x3. Roube a bandeira do inimigo e traga até a sua base. Quem fizer 3 capturas vence.',
  rev: 'Azul contra Vermelho, 3x3. Um objetivo por vez acende em um lugar aleatório: domine a zona antes do outro time. Quem fizer 5 pontos vence.',
};
const EQUIPES = { times: 1, band: 1, rev: 1 };
const NIVEL_NOME = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
const NIVEL_ID = ['facil', 'medio', 'dificil'];
const EMOTES = ['👍', '😂', '😡', 'GG'];
const CAMPOS_J = ['x', 'y', 'morto', 'tempoRenascer', 'pontos', 'dourado', 'bandeira', 'tempoColina', 'tempoOuro', 'tempoElim', 'abates', 'capturas', 'sequencia'];

let avisoLobby = null;
let euNum = null, ws = null, meuId = null, sala = null, apelido = '', tentativasRec = 0, timerLista = null, modoPreview = null;
const nomeDe = n => { const p = estado.jogadores.find(q => q.num === n); return p ? (p.nome || 'Jogador ' + n) : '?'; };
const enviar = o => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };

/* ---------- Estado local ---------- */
// Monta a arena do modo (mesmo código do offline) com todos como bot, ou com os jogadores da partida
function prepararLocal(m, slots) {
  modo = m;
  CONFIG_JOGADORES = MODOS[m].jogadores.map((c, i) => ({ time: c.time, controle: 'h' + (i + 1) }));
  ehBot = CONFIG_JOGADORES.map((c, i) => slots ? !!slots[i].bot : true);
  iniciarPartida();
  estado.jogadores.forEach((p, i) => { p.nome = slots ? slots[i].nome : 'Bot ' + (i + 1); p.pri = true; });
  if (!slots) estado.contagem = 0;
}
function revive(v) {
  if (v && typeof v === 'object') {
    if (Array.isArray(v)) return v.map(revive);
    if ('__n' in v) return Number(v.__n);
    if ('__p' in v) return estado.jogadores.find(p => p.num === v.__p) || null;
    const o = {}; for (const k in v) o[k] = revive(v[k]); return o;
  }
  return v;
}
function aplicarSnap(s) {
  const e = estado; if (!e || euNum === null) return;
  if (s.m) { MAPA = s.m; LINHAS = MAPA.length; COLUNAS = MAPA[0].length; }
  const antes = e.contagem;
  for (const d of s.j) {
    const p = e.jogadores.find(q => q.num === d.n); if (!p) continue;
    const ox = p.x, oy = p.y;
    for (const c of CAMPOS_J) p[c] = revive(d[c]);
    p.controle = d.b ? 'bot' : 'h' + d.n;
    if (d.d) p.dir = d.d;
    const salto = Math.abs(p.x - ox) + Math.abs(p.y - oy);
    if (p.pri) { p.rx = p.x; p.ry = p.y; p.pri = false; p.rastro = []; }
    else if (salto > 1) { p.rx = p.x; p.ry = p.y; p.rastro = []; p.nasce = .35; }
    else if (salto === 1) p.pulo = .18;
  }
  for (const k in s.e) e[k] = revive(s.e[k]);
  const n = Math.ceil(Math.max(0, e.contagem));
  if (e.contagem > 0 && n !== e.contagemNum) { e.contagemNum = n; tom(440, .15, 'square', .09); }
  if (antes > 0 && e.contagem <= 0) { tom(880, .4, 'square', .09); e.vai = .8; }
}
function aplicarEventos(lista) {
  const e = estado; if (!e || euNum === null) return;
  for (const v of lista) {
    if (v.k === 'tf') textoFlutuante(...v.a);
    else if (v.k === 'ef') criarEfeito(...v.a);
    else if (v.k === 'tr') tremer(v.t);
    else if (v.k === 'an') anunciar(v.texto, v.cor);
    else if (v.k === 'av') mostrarAviso(v.texto);
    else if (v.k === 'conf') soltarConfete(v.n);
    else if (v.k === 'som') { if (SONS[v.n]) SONS[v.n](...v.a); }
    else if (v.k === 'flash') e.flash = { t: v.t, cor: v.cor };
    else if (v.k === 'elim') {
      e.feed.unshift({ an: v.an, at: v.at, vn: v.vn, vt: v.vt, t: 4 });
      if (e.feed.length > 4) e.feed.length = 4;
    } else if (v.k === 'fim') {
      e.festa = 3; placar = v.placarObj;
      const ft = $('fimTexto');
      ft.textContent = v.texto; ft.style.color = v.cor; ft.style.textShadow = v.sombra;
      $('fimPlacar').innerHTML = v.placar; $('fimStats').innerHTML = v.stats;
      $('fim').style.display = 'flex';
    }
  }
}

/* ---------- Rede ---------- */
let timerRec = null;
function codigoDoLink() {
  try { const c = new URLSearchParams(location.search).get('sala'); return c ? c.toUpperCase().slice(0, 8) : null; } catch (e) { return null; }
}
function limparLink() { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
// Identificador que fica no navegador: permite voltar para a mesma vaga depois de uma queda de conexão
function meuToken() {
  try {
    let t = localStorage.getItem('arenaToken');
    if (!t) { t = Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join(''); localStorage.setItem('arenaToken', t); }
    return t;
  } catch (e) { return window.__tokenTemp || (window.__tokenTemp = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)); }
}
function pararLista() { if (timerLista) { clearInterval(timerLista); timerLista = null; } }
function voltarAoPreview(m) { euNum = null; modoPreview = m; prepararLocal(m); $('fim').style.display = 'none'; }

function conectar(nome) {
  const le = $('lobErro');
  if (location.protocol === 'file:') { if (le) le.textContent = 'Abra pelo endereço do servidor (http://...), não pelo arquivo.'; return; }
  apelido = nome;
  if (le) le.textContent = '';
  $('conexao').textContent = tentativasRec ? `Reconectando… (${tentativasRec})` : 'conectando…';
  const meu = ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => enviar({ t: 'entrar', nome, token: meuToken() });
  ws.onclose = () => {
    if (ws !== meu) return;
    pararLista();
    // caiu: tenta voltar sozinho por ~30 s (se estava numa partida, o servidor guarda a vaga)
    if (tentativasRec < 15) {
      tentativasRec++; $('conexao').textContent = `Reconectando… (${tentativasRec})`;
      timerRec = setTimeout(() => conectar(apelido), 2000);
      return;
    }
    tentativasRec = 0; $('conexao').textContent = ''; meuId = null; sala = null; voltarAoPreview('times');
    mostrarEntrada('Conexão perdida. Tente entrar de novo.');
  };
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.t === 'snap') aplicarSnap(m);
    else if (m.t === 'ev') aplicarEventos(m.lista);
    else if (m.t === 'bemvindo') {
      meuId = m.id; tentativasRec = 0; $('conexao').textContent = '';
      if (m.volta) return;                       // voltou para a partida: o servidor manda o resto
      sala = null; voltarAoPreview('times'); $('lobby').style.display = 'flex';
      const c = codigoDoLink();
      mostrarMenu();
      if (c) { limparLink(); enviar({ t: 'codigo', codigo: c }); }
    }
    else if (m.t === 'erro') { const el = $('lobErro'); if (el) el.textContent = m.msg; }
    else if (m.t === 'lista') mostrarLista(m.salas);
    else if (m.t === 'emote') { if (m.n) { (estado.emotes = estado.emotes || []).push({ num: m.n, txt: EMOTES[m.e], t: 2.2 }); } }
    else if (m.t === 'aviso') { mostrarAviso(m.texto); avisoLobby = { texto: m.texto, ate: Date.now() + 5000 }; if (sala && $('lobMsg') && $('lobby').style.display !== 'none') mostrarSala(); }
    else if (m.t === 'afk') mostrarAviso('Você ficou parado e virou bot. Mexa-se para voltar!');
    else if (m.t === 'menu') {
      pararLista(); sala = null; voltarAoPreview('times'); $('lobby').style.display = 'flex'; mostrarMenu();
    }
    else if (m.t === 'inicio') {
      pararLista();
      nivel = Math.max(0, NIVEL_ID.indexOf(m.nivel)); if (m.placar) placar = m.placar;
      prepararLocal(m.modo, m.slots); modoPreview = m.modo; euNum = m.voce;
      segOn.length = 0; $('fim').style.display = 'none'; $('lobby').style.display = 'none';
    } else if (m.t === 'sala') {
      pararLista(); sala = m; nivel = Math.max(0, NIVEL_ID.indexOf(m.nivel));
      if (!m.emJogo && (euNum !== null || modoPreview !== m.modo)) voltarAoPreview(m.modo);
      if (!m.emJogo || euNum === null) { $('lobby').style.display = 'flex'; $('lobby').classList.add('sala'); }
      mostrarSala();
    }
  };
}

/* ---------- Telas: apelido -> menu -> sala ---------- */
function mostrarEntrada(erro) {
  $('lobby').style.display = 'flex'; $('lobby').classList.remove('sala');
  let salvo = ''; try { salvo = localStorage.getItem('arenaNick') || ''; } catch (e) {}
  const convite = codigoDoLink();
  $('lobConteudo').innerHTML =
    (convite ? `<div id="lobMsg">Você foi convidado para a sala <b style="color:#ffd84d">${esc(convite)}</b></div>` : '') +
    `<input id="nick" class="campo" maxlength="12" placeholder="Seu apelido" value="${esc(salvo)}" autocomplete="off">` +
    `<div id="lobErro">${esc(erro || '')}</div><button id="entrarBtn" class="btn">ENTRAR<small>ENTER</small></button>`;
  const ir = () => {
    const nome = $('nick').value.trim(); if (!nome) { $('lobErro').textContent = 'Digite um apelido.'; return; }
    try { localStorage.setItem('arenaNick', nome); } catch (e) {}
    audio(); conectar(nome);
  };
  $('entrarBtn').onclick = ir;
  $('nick').onkeydown = e => { if (e.key === 'Enter') ir(); };
  $('nick').focus();
}

function mostrarMenu() {
  $('lobby').classList.remove('sala');
  $('lobConteudo').innerHTML =
    `<div id="lobMsg">Olá, <b style="color:#fff">${esc(apelido)}</b>!</div>` +
    '<button id="rapidoBtn" class="btn">JOGAR RÁPIDO<small>sala pública</small></button>' +
    '<div class="chips" style="margin-top:1.2em"><button class="chip" id="criarBtn">Criar sala privada</button></div>' +
    '<div class="chips"><input id="codigo" class="campo" style="width:6em;margin:0;font-size:1.1em;text-transform:uppercase" maxlength="4" placeholder="CÓDIGO" autocomplete="off">' +
    '<button class="chip" id="codigoBtn">Entrar com código</button></div>' +
    '<div id="lobErro"></div><div class="sub" style="margin:.2em 0 .4em;font-size:.8em">salas públicas</div><div id="listaSalas"></div>';
  pararLista(); enviar({ t: 'lista' }); timerLista = setInterval(() => enviar({ t: 'lista' }), 3000);
  $('rapidoBtn').onclick = () => enviar({ t: 'rapido' });
  $('criarBtn').onclick = () => enviar({ t: 'criar' });
  const entrar = () => { const c = $('codigo').value.trim(); if (c) enviar({ t: 'codigo', codigo: c }); };
  $('codigoBtn').onclick = entrar;
  $('codigo').onkeydown = e => { if (e.key === 'Enter') entrar(); };
}

function mostrarLista(salas) {
  const el = $('listaSalas'); if (!el) return;
  if (!salas.length) { el.innerHTML = '<div class="vaga" style="text-align:center">Nenhuma sala pública agora. Use “Jogar rápido” para criar uma.</div>'; return; }
  el.innerHTML = salas.map(s =>
    `<div class="linha-sala"><b>${esc(s.codigo)}</b><span>${s.n}/${s.max}</span><span>${esc(MODOS[s.modo] ? MODOS[s.modo].nome : '')}</span>` +
    `<span>${s.emJogo ? 'em jogo' : 'aguardando'}</span><button class="chip" data-codigo="${esc(s.codigo)}">Entrar</button></div>`).join('');
  el.querySelectorAll('button').forEach(b => b.onclick = () => enviar({ t: 'codigo', codigo: b.dataset.codigo }));
}

function copiarLink() {
  const link = location.origin + location.pathname + '?sala=' + sala.codigo;
  const ok = () => { const b = $('linkBtn'); if (b) { b.textContent = 'Link copiado!'; setTimeout(() => { if ($('linkBtn')) $('linkBtn').textContent = 'Copiar link'; }, 1500); } };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(link).then(ok, () => prompt('Copie o link:', link));
  else prompt('Copie o link:', link);
}

function mostrarSala() {
  if (!sala || meuId === null) return;
  const souDono = sala.dono === meuId, m = sala.modo, equipes = !!EQUIPES[m];
  const eu = sala.jogadores.find(j => j.id === meuId);
  const podeEditar = souDono && !sala.emJogo;
  // cartões dos modos (só o dono troca)
  const cartoes = ORDEM.map(k =>
    `<button class="modo${k === m ? ' sel' : ''}" data-modo="${k}"${podeEditar ? '' : ' disabled'}><div class="ic">${ICONES[k]}</div><b>${esc(MODOS[k].nome)}</b></button>`).join('');
  const passos = MODOS[m].passos.map(([ic, titulo, texto]) => `<div class="passo"><div class="ic">${ic}</div><b>${titulo}</b><small>${texto}</small></div>`).join('');
  let jogadores = '';
  if (equipes) {
    const coluna = time => {
      const lista = sala.jogadores.filter(j => j.time === time);
      let h = `<div class="coluna" style="border-color:${COR[time]}"><h3 style="color:${COR_CLARA[time]}">${NOME[time].toUpperCase()}</h3>`;
      for (const j of lista) h += `<div class="jog${j.id === meuId ? ' eu' : ''}">${j.id === sala.dono ? '👑 ' : ''}${esc(j.nome)}${j.id === meuId ? ' (você)' : ''}</div>`;
      for (let i = lista.length; i < 3; i++) h += '<div class="vaga">vaga → bot</div>';
      if (!sala.emJogo && eu && eu.time !== time && lista.length < 3) h += `<button class="chip trocar" data-time="${time}">Ir para o ${NOME[time]}</button>`;
      return h + '</div>';
    };
    jogadores = `<div class="times">${coluna('azul')}${coluna('vermelho')}</div>`;
  } else {
    // todos contra todos: cada um recebe uma cor, na ordem de entrada
    let h = '<div class="coluna" style="border-color:#8ea0ff"><h3 style="color:#c5cde3">JOGADORES</h3><div class="grade6">';
    for (let i = 0; i < 6; i++) {
      const j = sala.jogadores[i], cor = MODOS[m].jogadores[i].time;
      h += j ? `<div class="jog${j.id === meuId ? ' eu' : ''}" style="border-left:.5em solid ${COR[cor]}">${j.id === sala.dono ? '👑 ' : ''}${esc(j.nome)}${j.id === meuId ? ' (você)' : ''}</div>`
             : `<div class="vaga" style="border-left:.5em solid ${COR_ESCURA[cor]}">vaga → bot</div>`;
    }
    jogadores = `<div class="times">${h}</div></div></div>`;
  }
  const msg = (avisoLobby && avisoLobby.ate > Date.now()) ? avisoLobby.texto : sala.emJogo ? 'Partida em andamento. Você entra na próxima.'
    : souDono ? 'Você é o dono da sala: escolha o modo. Vagas vazias viram bots.' : 'Aguardando o dono começar…';
  $('lobConteudo').innerHTML =
    `<div class="sala-topo">Sala <b>${esc(sala.codigo)}</b> · ${sala.publica ? 'pública' : 'privada'} ` +
    `<button class="chip" id="linkBtn">Copiar link</button><button class="chip" id="sairBtn">Sair da sala</button></div>` +
    `<div class="modos">${cartoes}</div><div id="modoDesc">${esc(DESCR[m])}</div><div class="passos">${passos}</div>` +
    `${jogadores}<div id="lobMsg">${msg}</div>` +
    `<div class="chips">${podeEditar ? `<button class="chip" id="nivelBtn">Bots: <b>${NIVEL_NOME[sala.nivel]}</b></button>` : `<span class="chip">Bots: <b>${NIVEL_NOME[sala.nivel]}</b></span>`}</div>` +
    (podeEditar ? '<button id="comecarBtn" class="btn">COMEÇAR<small>ENTER</small></button>' : '') + '<div id="lobErro"></div>';
  document.querySelectorAll('.trocar').forEach(b => b.onclick = () => enviar({ t: 'time', time: b.dataset.time }));
  document.querySelectorAll('.modo').forEach(b => b.onclick = () => { if (podeEditar) enviar({ t: 'modo', modo: b.dataset.modo }); });
  const nb = $('nivelBtn'); if (nb) nb.onclick = () => enviar({ t: 'nivel', nivel: NIVEL_ID[(NIVEL_ID.indexOf(sala.nivel) + 1) % 3] });
  const cb = $('comecarBtn'); if (cb) cb.onclick = () => enviar({ t: 'comecar' });
  $('linkBtn').onclick = copiarLink;
  $('sairBtn').onclick = () => enviar({ t: 'sair' });
}

/* ---------- Entrada (teclado e toque): manda só a direção; o servidor anda ---------- */
const TECLAS_ON = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
};
const segOn = [];
const emPartida = () => euNum !== null && estado && !estado.vencedor;
window.addEventListener('keydown', e => {
  audio();
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Enter' && $('comecarBtn')) { e.preventDefault(); enviar({ t: 'comecar' }); return; }
  if (e.code === 'Escape' && sala) { abandonar(); return; }
  if (/^Digit[1-4]$/.test(e.code)) { if (emPartida() && !e.repeat) enviar({ t: 'emote', e: +e.code[5] - 1 }); return; }
  if (e.code === 'KeyV') { somLigado = !somLigado; mostrarAviso(`Som ${somLigado ? 'ligado' : 'desligado'}`); return; }
  const dir = TECLAS_ON[e.code]; if (!dir) return;
  e.preventDefault();
  if (e.repeat || !emPartida()) return;
  segOn.push(e.code);
  enviar({ t: 'dir', d: dir });
});
window.addEventListener('keyup', e => {
  const i = segOn.indexOf(e.code); if (i < 0) return;
  segOn.splice(i, 1);
  if (segOn.length) enviar({ t: 'dir', d: TECLAS_ON[segOn[segOn.length - 1]] });
  else enviar({ t: 'dir', s: true });
});
window.addEventListener('blur', () => { if (segOn.length) { segOn.length = 0; enviar({ t: 'dir', s: true }); } });

let dedoOn = null;
window.addEventListener('touchstart', e => {
  audio();
  if (dedoOn || e.target.closest('button, input')) return;
  const t = e.changedTouches[0]; dedoOn = { id: t.identifier, x: t.clientX, y: t.clientY, ult: null };
}, { passive: true });
window.addEventListener('touchmove', e => {
  if (e.cancelable && !e.target.closest('input') && !($('lobby').style.display !== 'none' && e.target.closest('#lobby'))) e.preventDefault();
  const t = dedoOn && [...e.changedTouches].find(t => t.identifier === dedoOn.id); if (!t || !emPartida()) return;
  const dx = t.clientX - dedoOn.x, dy = t.clientY - dedoOn.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
  const dir = Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1];
  dedoOn.x = t.clientX; dedoOn.y = t.clientY;
  if (dedoOn.ult && dedoOn.ult[0] === dir[0] && dedoOn.ult[1] === dir[1]) return;
  dedoOn.ult = dir; enviar({ t: 'dir', d: dir });
}, { passive: false });
function soltarDedoOn(e) {
  if (!dedoOn || ![...e.changedTouches].some(t => t.identifier === dedoOn.id)) return;
  dedoOn = null; enviar({ t: 'dir', s: true });
}
window.addEventListener('touchend', soltarDedoOn);
window.addEventListener('touchcancel', soltarDedoOn);

/* ---------- Abandonar ---------- */
function abandonar() {
  const emJogo = euNum !== null && estado && !estado.vencedor;
  if (emJogo && !confirm('Abandonar a partida? Um bot assume o seu lugar.')) return;
  if (!emJogo && $('lobby').style.display === 'none' && !confirm('Sair da sala?')) return;
  enviar({ t: 'sair' });
}
$('abandonarBtn').onclick = () => { audio(); abandonar(); };
$('fimSair').onclick = () => abandonar();

/* ---------- Emotes ---------- */
// Balão de emote em cima do jogador que mandou
function desenharEmotes(T) {
  if (!estado.emotes) return;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const em of estado.emotes) {
    const p = estado.jogadores.find(q => q.num === em.num); if (!p || p.morto > 0) continue;
    const sobe = Math.min(1, (2.2 - em.t) / .15), x = (p.rx + .5) * T, y = (p.ry + .5) * T - T * (1.05 + .25 * sobe);
    ctx.globalAlpha = Math.min(1, em.t / .4);
    const tam = Math.round(T * .5); ctx.font = `900 ${tam}px ${FONTE}`;
    const w = ctx.measureText(em.txt).width + tam * .7, h = tam * 1.3;
    ctx.fillStyle = '#fff'; rr(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 5, y + h / 2 - 1); ctx.lineTo(x + 5, y + h / 2 - 1); ctx.lineTo(x, y + h / 2 + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#10131f'; ctx.fillText(em.txt, x, y + 1);
  }
  ctx.restore();
}
$('emotes').querySelectorAll('button[data-e]').forEach(b => b.onclick = () => { audio(); enviar({ t: 'emote', e: +b.dataset.e }); b.blur(); });

/* ---------- Loop ---------- */
let emotesVisiveis = false;
function atualizarOn(dt) {
  if (estado.vai > 0) estado.vai -= dt;
  atualizarEfeitos(dt);
  if (estado.emotes) { for (const e of estado.emotes) e.t -= dt; estado.emotes = estado.emotes.filter(e => e.t > 0); }
  const ver = !!emPartida();
  if (ver !== emotesVisiveis) { emotesVisiveis = ver; $('emotes').style.visibility = ver ? 'visible' : 'hidden'; }
}
let ultimo = performance.now();
function loop(agora) {
  const dt = Math.max(0, Math.min(0.1, (agora - ultimo) / 1000));
  ultimo = agora; agoraS = agora / 1000; window.__f = (window.__f || 0) + 1;
  atualizarOn(dt); desenhar();
  requestAnimationFrame(loop);
}
prepararLocal('times');
mostrarEntrada();
requestAnimationFrame(loop);

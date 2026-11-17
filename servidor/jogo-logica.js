/* =====================================================================
   CONSTANTES
   ===================================================================== */
const TEMPO_CAPTURA  = 5;     // segundos parado em cima de um objetivo
const TEMPO_RENASCER = 2;     // segundos fora do jogo depois de ser eliminado (modo Times 3x3)
const TEMPO_RENASCER_OURO = 0.3; // idem na Corrida do Ouro: 300 ms
const DELAY_MOVIMENTO = 150;  // ms mínimos entre dois passos do jogador (vale ao segurar e ao apertar a tecla várias vezes)
const TEMPO_CONTAGEM  = 3;    // segundos de contagem regressiva antes de começar
const TAMANHO_TILE    = 52;   // px máximos de cada quadrado (diminui sozinho se o mapa for grande)
const ALTURA_HUD      = 84;   // px reservados no topo para o HUD

// Modo Corrida do Ouro
const PONTOS_PARA_VENCER      = 3;    // entregas de Ouro para vencer
const EMBOSCADORES            = 1;    // quantos bots esperam de tocaia na entrada da base de quem carrega o Ouro
const RITMO_OURO              = 1.4; // multiplica o tempo entre passos (humanos e bots) nos dois modos: maior = mais lento
const DELAY_MOVIMENTO_DOURADO = 150;  // ms entre passos de quem carrega o Ouro (igual a DELAY_MOVIMENTO = sem diferença; maior = mais lento, e os perseguidores conseguem alcançá-lo)
const TEMPO_TROCA_PAREDES     = 1.5;    // segundos que a caixa central fica fechada / aberta
const TEMPO_AVISO_PAREDES     = 0.5;  // segundos antes da troca em que os quadrados que vão mudar piscam

// Modo Rei da Colina
const TEMPO_PARA_VENCER_REI = 20;   // segundos (somados) sozinho na colina para vencer
const TEMPO_TROCA_COLINA    = 20;   // segundos até a colina pular para outro lugar
const TEMPO_AVISO_COLINA    = 3;    // segundos antes da troca em que o próximo lugar pisca
const TEMPO_RENASCER_REI    = 1.5;  // segundos fora do jogo depois de ser eliminado

// Modo Pega-Pega do Ouro
const TEMPO_PARA_VENCER_PEGA = 20;  // segundos (somados) segurando o Ouro para vencer
const TEMPO_RENASCER_PEGA    = 1.5; // segundos fora do jogo depois de ser eliminado
// Modo Sobrevivência (ninguém renasce; a borda da arena vira parede, anel por anel)
const TEMPO_INICIO_ZONA = 14;       // segundos até o primeiro anel fechar
const TEMPO_ENTRE_ZONA  = 9;        // segundos entre um fechamento e o próximo
const TEMPO_ZONA_FINAL  = 6;        // idem, nos últimos três (a fileira do meio encolhendo)
const TEMPO_AVISO_ZONA  = 3;        // segundos antes do fechamento em que os quadrados do anel piscam

// Modo Bandeira (Times 3x3: roube a bandeira inimiga e traga até a sua base)
const PONTOS_PARA_VENCER_BAND = 3;    // capturas para vencer
const TEMPO_BANDEIRA_VOLTA    = 10;   // segundos até uma bandeira caída voltar sozinha para a base
const TEMPO_RENASCER_BAND     = 2.5;  // segundos fora do jogo depois de ser eliminado
const LENTIDAO_BANDEIRA       = 1.15; // quem carrega a bandeira anda mais devagar (1 = igual aos outros)

// Modo Revezamento de objetivos (Times 3x3: um objetivo por vez, em ordem aleatória)
const PONTOS_PARA_VENCER_REV = 5;     // objetivos capturados para vencer
const TEMPO_CAPTURA_REV      = 4;     // segundos de um jogador sozinho na zona (mais jogadores do time = mais rápido)
const TEMPO_ESPERA_REV       = 2;     // segundos entre um objetivo e o próximo (o novo lugar pisca antes de acender)
const TEMPO_OBJ_EXPIRA       = 20;    // segundos até um objetivo que ninguém capturou apagar e passar para outro lugar
const TEMPO_RENASCER_REV     = 2;     // segundos fora do jogo depois de ser eliminado

const LENTIDAO_OURO_PEGA     = 1.25; // quem segura o Ouro anda mais devagar (1 = igual aos outros; maior = mais lento), para dar para alcançá-lo

// Dificuldade dos bots (tecla F): velocidade, agressividade e chance de errar o passo
const NIVEIS = [
  { nome: 'Fácil',   delay: 450, atq: .30, atqInv: .45, erro: .15 },
  { nome: 'Médio',   delay: 300, atq: .50, atqInv: .65, erro: .03 },
  { nome: 'Difícil', delay: 200, atq: .85, atqInv: .95, erro: 0 },
];

/* =====================================================================
   MAPAS (fáceis de editar). Legenda: # parede | . neutro | N objetivo neutro
   B/R chão da base azul/vermelha | S/T spawn azul/vermelho | x/y objetivo da base azul/vermelha
   b/r portão da base azul/vermelha. Cada time precisa de 3 spawns e do mesmo nº de x e y.
   ===================================================================== */
const MAPAS = [
  { nome: 'Clássico', linhas: [
    "#########################",
    "#BBBBBBB#N.....N#RRRRRRR#",
    "#BBBBBBB#.......#RRRRRRR#",
    "#SB#x#BBb..#.#..rRR#y#RT#",
    "#SBx##BBb...N...rRR##yRT#",
    "#SB#x#BBb..#.#..rRR#y#RT#",
    "#BBBBBBB#.......#RRRRRRR#",
    "#BBBBBBB#N.....N#RRRRRRR#",
    "#########################",
  ] },
];
let mapaIdx = 0, MAPA, LINHAS, COLUNAS;
function carregarMapa(i) {
  mapaIdx = i;
  MAPA = MAPAS[i].linhas; LINHAS = MAPA.length; COLUNAS = MAPA[0].length;
}

/* ---------- Mapa da Corrida do Ouro (paredes que se movem) ----------
   Legenda: # parede | . chão | O Ouro (centro) | 1 a 6 base (e ponto de nascimento) de cada jogador.
   Dois estados: caixa central FECHADA (inicial) e ABERTA. Os quadrados que mudam entre um e outro
   (as listas OURO_VIRAM_*) são calculados comparando os dois mapas. Coordenadas: [coluna, linha] desde 0. */
const OURO_MAPA_FECHADO = [
  "#################",
  "####1.#####.2####",
  "#####.#####.#####",
  "###...........###",
  "###...........###",
  "###..#######..###",
  "###..#.....#..###",
  "###..#.....#..#3#",
  "#....#..O..#....#",
  "#6#..#.....#..###",
  "###..#.....#..###",
  "###..#######..###",
  "###...........###",
  "###...........###",
  "#####.#####.#####",
  "####5.#####.4####",
  "#################",
];
const OURO_MAPA_ABERTO = [
  "#################",
  "####1.#####.2####",
  "#####.#####.#####",
  "###...........###",
  "###...........###",
  "###..#.....#..###",
  "###...........###",
  "###...........#3#",
  "#.......O.......#",
  "#6#...........###",
  "###...........###",
  "###..#.....#..###",
  "###...........###",
  "###...........###",
  "#####.#####.#####",
  "####5.#####.4####",
  "#################",
];
const naLista = (lista, x, y) => lista.some(([a, b]) => a === x && b === y);
// Quadrados que mudam de um estado para o outro (o "O" conta como chão)
const OURO_VIRAM_CHAO = [], OURO_VIRAM_PAREDE = [];
OURO_MAPA_FECHADO.forEach((linha, y) => [...linha].forEach((c, x) => {
  const a = OURO_MAPA_ABERTO[y][x];
  if (c === '#' && a !== '#') OURO_VIRAM_CHAO.push([x, y]);      // porta da caixa: abre
  if (c !== '#' && a === '#') OURO_VIRAM_PAREDE.push([x, y]);    // parede que aparece
}));

/* ---------- Configurações e placar (salvos no navegador) ---------- */
// iniciado = false: tela de início, com uma partida de demonstração (só bots) rodando ao fundo
let nivel = 1, somLigado = true, musicaLigada = true, iniciado = false, pausado = false;
let modo = 'times'; // modo de jogo escolhido no menu: 'times' | 'ouro' (as regras de cada um ficam em MODOS)
let placar = { azul: 0, vermelho: 0 };
const N = () => NIVEIS[nivel];
const M = () => MODOS[modo];
function salvar() {
  try { localStorage.setItem('arenaObjetivos', JSON.stringify({ placar, nivel, mapaIdx, somLigado, musicaLigada, modo })); } catch (e) {}
}
function carregarSalvo() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('arenaObjetivos')) || {}; } catch (e) {}
  if (s.placar) placar = { azul: +s.placar.azul || 0, vermelho: +s.placar.vermelho || 0 };
  if (NIVEIS[s.nivel]) nivel = s.nivel;
  if (typeof s.somLigado === 'boolean') somLigado = s.somLigado;
  if (typeof s.musicaLigada === 'boolean') musicaLigada = s.musicaLigada;
  if (MODOS[s.modo]) modo = s.modo;
}

/* ---------- Sons (Web Audio, sem arquivos) ---------- */
let audioCtx = null;
function audio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function tom(freq, dur, tipo = 'square', vol = .08, atraso = 0, freqFim = null) {
  if (!somLigado || !iniciado) return; // a demonstração da tela de início é muda
  const a = audio(); if (!a) return;
  const t0 = a.currentTime + atraso, o = a.createOscillator(), g = a.createGain();
  o.type = tipo; o.frequency.setValueAtTime(freq, t0);
  if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + .02);
}
const SONS = {
  captura:  () => [523, 659, 784].forEach((f, i) => tom(f, .16, 'triangle', .1, i * .08)),
  portao:   () => { tom(180, .7, 'sawtooth', .07, 0, 900); tom(360, .7, 'square', .04, .2, 1300); tom(880, .2, 'triangle', .08, .75); tom(1175, .35, 'triangle', .08, .9); },
  eliminar: () => { tom(320, .25, 'sawtooth', .09, 0, 60); tom(90, .2, 'sine', .12, 0, 40); },
  sequencia: n => [0, 1, 2].forEach(i => tom(520 + n * 90 + i * 130, .1, 'square', .06, .08 + i * .07)),
  renascer: () => tom(400, .15, 'sine', .07, 0, 800),
  vitoria:  () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tom(f, .26, 'square', .08, i * .14)),
  pausa:    () => tom(500, .08, 'triangle', .08),
  ouro:     () => [988, 1319, 1568].forEach((f, i) => tom(f, .12, 'triangle', .09, i * .06)),
  paredes:  aberto => tom(aberto ? 260 : 180, .1, 'square', .03, 0, aberto ? 420 : 110),
  colina:   () => [392, 523, 659].forEach((f, i) => tom(f, .14, 'triangle', .09, i * .07)),
  tique:    () => tom(880, .06, 'triangle', .05),
};

// Música de fundo: uma batida simples gerada na hora, que acelera quando um portão abre
const BAIXO = [110, 110, 131, 110, 87, 87, 98, 98, 110, 110, 131, 147, 165, 147, 131, 98];
const ARP   = [440, 523, 659, 523, 349, 440, 523, 440, 440, 523, 659, 784, 659, 587, 523, 392];
let musProx = 0, musPasso = 0;
function tocarMusica() {
  if (!somLigado || !musicaLigada || !iniciado || pausado || estado.vencedor || estado.contagem > 0) { musProx = 0; return; }
  const a = audio(); if (!a || a.state !== 'running') return;
  const invasao = M().musicaRapida(); // momento tenso do modo (portão aberto / alguém com o Ouro)
  const passo = invasao ? .17 : .22;
  if (musProx < a.currentTime) musProx = a.currentTime + .05;
  while (musProx < a.currentTime + .25) {
    const at = musProx - a.currentTime, i = musPasso % 16;
    tom(BAIXO[i], passo * .9, 'triangle', .05, at);
    if (i % 2 === 0) tom(ARP[i], passo * .8, 'square', .012, at);
    else if (invasao) tom(ARP[i] * 2, passo * .5, 'square', .008, at);
    if (i % 4 === 0) tom(150, .12, 'sine', .09, at, 45); // bumbo
    musPasso++; musProx += passo;
  }
}

/* Jogadores: lista de {time, controle}. Para 3x3 basta adicionar mais
   entradas (cada time tem 3 pontos de spawn). controle: 'setas' | 'wasd' | 'bot' */
const JOGADORES_TIMES = [
  { time: 'azul',     controle: 'setas' },  // 1
  { time: 'azul',     controle: 'bot'   },  // 2
  { time: 'azul',     controle: 'bot'   },  // 3
  { time: 'vermelho', controle: 'wasd'  },  // 4
  { time: 'vermelho', controle: 'bot'   },  // 5
  { time: 'vermelho', controle: 'bot'   },  // 6
];
/* Corrida do Ouro: cada jogador é um "time" de uma pessoa só, com a sua cor.
   A ordem é a das bases no mapa (jogador 1 = base 1, e assim por diante). */
const CORES_OURO = ['azul', 'vermelho', 'verde', 'amarelo', 'roxo', 'laranja'];
const JOGADORES_OURO = [
  { time: 'azul',     controle: 'setas' },  // 1
  { time: 'vermelho', controle: 'wasd'  },  // 2 (a tecla 2 liga/desliga: vira bot)
  { time: 'verde',    controle: 'bot'   },  // 3
  { time: 'amarelo',  controle: 'bot'   },  // 4
  { time: 'roxo',     controle: 'bot'   },  // 5
  { time: 'laranja',  controle: 'bot'   },  // 6
];
// Celular/tablet (tela de toque, sem teclado): só existe um jogador humano, que anda deslizando o dedo.
// Quem jogaria no WASD vira bot.
const TOQUE = window.matchMedia('(pointer: coarse)').matches;
if (TOQUE) {
  document.documentElement.classList.add('toque');
  for (const c of [...JOGADORES_TIMES, ...JOGADORES_OURO]) if (c.controle === 'wasd') c.controle = 'bot';
}
// Jogadores do modo atual e quais deles estão como bot (teclas 1–6 alternam). Trocados em selecionarModo().
let CONFIG_JOGADORES = JOGADORES_TIMES;
let ehBot = CONFIG_JOGADORES.map(c => c.controle === 'bot');

const COR        = { azul: '#3b82f6', vermelho: '#ef4444', verde: '#22c55e', amarelo: '#eab308', roxo: '#a855f7', laranja: '#f97316', neutro: '#8a8f98' };
const COR_CLARA  = { azul: '#8ec0ff', vermelho: '#ff9a9a', verde: '#86efac', amarelo: '#fde68a', roxo: '#d8b4fe', laranja: '#fdba74' };
const COR_ESCURA = { azul: '#1d4ed8', vermelho: '#b91c1c', verde: '#15803d', amarelo: '#a16207', roxo: '#7e22ce', laranja: '#c2410c' };
const NOME       = { azul: 'Azul', vermelho: 'Vermelho', verde: 'Verde', amarelo: 'Amarelo', roxo: 'Roxo', laranja: 'Laranja' };
const DOURADO = '#ffd84d';
const INIMIGO = { azul: 'vermelho', vermelho: 'azul' };

/* =====================================================================
   LÓGICA (sem nada de desenho)
   ===================================================================== */
let estado;

// Controle configurado de um jogador: bot, o teclado original, ou 'nenhum' (parado)
function controleConfig(i) {
  if (ehBot[i]) return 'bot';
  return CONFIG_JOGADORES[i].controle === 'bot' ? 'nenhum' : CONFIG_JOGADORES[i].controle;
}
// Controle em uso agora: na demonstração da tela de início todo mundo é bot
function controleDe(i) { return iniciado ? controleConfig(i) : 'bot'; }

// Cria uma partida nova do modo atual. A parte comum fica aqui; M().preparar() monta o que é do modo
// (carrega o mapa, preenche estado.spawns e os objetivos).
function iniciarPartida() {
  estado = {
    objetivos: [],
    portaoAberto: { azul: false, vermelho: false }, // true = aberto para o inimigo do dono
    jogadores: [],
    spawns: {},                               // spawns[time] = lista de quadrados onde o time nasce
    eliminacoes: {},                          // eliminações por time/cor
    ouro: null, paredes: null,                // só na Corrida do Ouro
    vencedor: null,
    aviso: { texto: '', t: 0 },
    flash: { t: 0, cor: '#fff' },            // brilho nas bordas quando um portão abre
    portaoAbertoEm: { azul: -99, vermelho: -99 }, // momento (estado.tempo) em que cada portão abriu
    particulas: [],
    textos: [],                               // textos que sobem e somem ("CAPTURADO!", "DUPLA!"...)
    confete: [],
    feed: [],                                 // últimas eliminações (canto superior direito)
    anuncio: { texto: '', cor: '#fff', t: 0 }, // letreiro grande no centro
    tremor: 0,                                // tremida de tela (segundos restantes)
    festa: 0, reinicio: 0,
    tempo: 0,
  };
  estado.contagem = iniciado ? TEMPO_CONTAGEM : 0; // contagem regressiva antes de liberar o jogo
  estado.contagemNum = 0; estado.vai = 0;
  pausado = false;
  document.getElementById('pausa').style.display = 'none';
  for (const c of CONFIG_JOGADORES) { estado.spawns[c.time] = []; estado.eliminacoes[c.time] = 0; }
  M().preparar();
  const usados = {};
  CONFIG_JOGADORES.forEach((cfg, i) => {
    usados[cfg.time] = usados[cfg.time] || 0;
    const sp = estado.spawns[cfg.time][usados[cfg.time]++];
    estado.jogadores.push({
      num: i + 1,
      time: cfg.time,
      controle: controleDe(i),
      x: sp.x, y: sp.y,
      rx: sp.x, ry: sp.y, // posição desenhada (desliza até x,y); a lógica usa só x,y
      cd: Math.random() * N().delay, toque: null,
      morto: 0, // segundos restantes até renascer (0 = vivo)
      // só para o visual e as estatísticas:
      dir: [sp.x < COLUNAS / 2 ? 1 : -1, 0], pulo: 0, nasce: .35, rastro: [],
      abates: 0, capturas: 0, sequencia: 0,
      pontos: 0, dourado: false, // Corrida do Ouro: entregas feitas e se está carregando o Ouro
      tempoColina: 0,            // Rei da Colina: segundos acumulados sozinho na colina
      tempoOuro: 0,              // Pega-Pega do Ouro: segundos acumulados segurando o Ouro
      tempoElim: 0,              // Sobrevivência: em que momento da partida foi eliminado (para o ranking)
    });
  });
  atualizarPainel();
  atualizarOpcoes();
  document.getElementById('fim').style.display = 'none';
}

function atualizarOpcoes() {
  document.getElementById('optNivel').innerHTML = `Bots: <b>${N().nome}</b> &nbsp;<kbd>F</kbd>`;
  document.getElementById('optSom').innerHTML = `Som: <b>${somLigado ? 'ligado' : 'desligado'}</b> &nbsp;<kbd>V</kbd>`;
  document.getElementById('optMusica').innerHTML = `Música: <b>${musicaLigada ? 'ligada' : 'desligada'}</b> &nbsp;<kbd>N</kbd>`;
}

function novoObjetivo(x, y, tipo, baseDe) {
  // dono: null (neutro) | 'azul' | 'vermelho'; permanente: objetivo de base já conquistado
  return { x, y, tipo, baseDe, dono: null, progresso: 0, permanente: false };
}

function tileEm(x, y) {
  if (y < 0 || y >= LINHAS || x < 0 || x >= COLUNAS) return '#';
  return MAPA[y][x];
}
function jogadorEm(x, y) {
  return estado.jogadores.find(j => j.morto <= 0 && j.x === x && j.y === y); // eliminados não ocupam quadrado
}
// Terreno (parede/portão) — ignora jogadores
function terrenoLivre(time, x, y) {
  const c = tileEm(x, y);
  if (c === '#') return false;
  // Portão fechado para o inimigo funciona como parede
  if (c === 'b' && time !== 'azul' && !estado.portaoAberto.azul) return false;
  if (c === 'r' && time !== 'vermelho' && !estado.portaoAberto.vermelho) return false;
  // Corrida do Ouro: a base (1 a 6) só deixa o dono entrar; para os outros é parede
  if (c >= '1' && c <= '6') return CORES_OURO[c - 1] === time;
  return true;
}
function chaoDoTile(c) { // 'azul' | 'vermelho' | 'neutro'
  if ('BSxb'.includes(c)) return 'azul';
  if ('RTyr'.includes(c)) return 'vermelho';
  return 'neutro';
}

function mostrarAviso(texto) { estado.aviso = { texto, t: 3 }; }
function fmtTempo(s) { s = Math.floor(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

/* ---------- Efeitos (a lógica só pede; o desenho fica na renderização) ---------- */
function textoFlutuante(x, y, texto, cor, tam = 15) { estado.textos.push({ x: x + .5, y: y + .1, texto, cor, tam, vida: 1.2 }); }
function tremer(t) { estado.tremor = Math.max(estado.tremor, t); }
function anunciar(texto, cor) { estado.anuncio = { texto, cor, t: 1.8 }; }

function criarEfeito(x, y, cor, n = 14, raio = 1.2) {
  const cx = x + .5, cy = y + .5;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 4.5, vida = .45 + Math.random() * .4;
    estado.particulas.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida, vidaMax: vida, cor, tam: 2 + Math.random() * 3.5 });
  }
  estado.particulas.push({ x: cx, y: cy, anel: true, vida: .45, vidaMax: .45, cor, raio });
}

function soltarConfete(n) {
  const cores = ['#60a5fa', '#f87171', '#fde047', '#4ade80', '#ffffff', COR[estado.vencedor] || '#fff'];
  for (let i = 0; i < n; i++) {
    estado.confete.push({
      x: Math.random() * 1200, y: -20 - Math.random() * 220, vx: (Math.random() - .5) * 160, vy: Math.random() * 120,
      r: Math.random() * 6.28, vr: (Math.random() - .5) * 10, w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
      cor: cores[Math.floor(Math.random() * cores.length)],
    });
  }
}

// Tenta mover o jogador 1 quadrado; "subir em cima" do inimigo elimina ele
function tentarMover(p, dx, dy) {
  const nx = p.x + dx, ny = p.y + dy;
  p.dir = [dx, dy];
  if (!terrenoLivre(p.time, nx, ny)) return false;
  // fogo amigo: pisar em qualquer jogador (aliado ou inimigo) elimina ele
  const ocupante = jogadorEm(nx, ny);
  if (ocupante) eliminar(ocupante, p);
  p.x = nx; p.y = ny;
  p.pulo = .18;
  M().aoMover(p); // regras do modo para "chegou num quadrado" (pegar/entregar o Ouro)
  return true;
}
// Espera entre passos de um jogador humano (quem carrega o Ouro pode ter um delay diferente)
function delayDe(p) { return (p.dourado ? DELAY_MOVIMENTO_DOURADO * (M().lentidaoDourado || 1) : DELAY_MOVIMENTO) * M().ritmo; }

function objetivoEm(x, y) { return estado.objetivos.find(o => o.x === x && o.y === y); }

// Elimina "vitima". algoz = quem pisou nela, ou null quando foi uma parede que apareceu em cima
function eliminar(vitima, algoz) {
  const inimigo = !algoz || vitima.time !== algoz.time;
  if (algoz && inimigo) { // fogo amigo não conta ponto
    estado.eliminacoes[algoz.time]++; algoz.abates++; algoz.sequencia++;
    const s = algoz.sequencia;
    if (s >= 2) {
      textoFlutuante(vitima.x, vitima.y - .7, s === 2 ? 'DUPLA!' : s === 3 ? 'TRIPLA!' : 'IMPARÁVEL!', '#ffd84d', 22);
      SONS.sequencia(s);
    }
  }
  vitima.sequencia = 0;
  textoFlutuante(vitima.x, vitima.y, !algoz ? 'ESMAGADO!' : inimigo ? 'ELIMINADO!' : 'FOGO AMIGO!', '#fff', 13);
  estado.feed.unshift({ an: algoz ? algoz.num : null, at: algoz ? algoz.time : null, vn: vitima.num, vt: vitima.time, t: 4 });
  if (estado.feed.length > 4) estado.feed.length = 4;
  criarEfeito(vitima.x, vitima.y, COR_CLARA[vitima.time], 24, 1.6);
  tremer(.22);
  SONS.eliminar();
  // sai do jogo por TEMPO_RENASCER segundos; depois volta num spawn livre da própria base
  vitima.morto = vitima.tempoRenascer = M().tempoRenascer;
  vitima.toque = null;
  vitima.rastro = [];
  M().aoEliminar(vitima, algoz); // regras do modo (Ouro: volta para o centro; Pega-Pega: passa para quem pisou)
}

// Tenta recolocar o jogador num spawn livre da base (ou qualquer chão livre dela). Devolve true se conseguiu.
function renascer(p) {
  let destino = estado.spawns[p.time].find(s => !jogadorEm(s.x, s.y));
  if (!destino) {
    for (let y = 0; y < LINHAS && !destino; y++)
      for (let x = 0; x < COLUNAS; x++)
        if (chaoDoTile(MAPA[y][x]) === p.time && 'BSxyTR'.includes(MAPA[y][x]) && !jogadorEm(x, y)) { destino = { x, y }; break; }
  }
  if (!destino) return false;
  p.x = p.rx = destino.x; p.y = p.ry = destino.y;
  p.cd = DELAY_MOVIMENTO * M().ritmo;
  p.nasce = .35; p.rastro = [];
  criarEfeito(p.x, p.y, COR_CLARA[p.time], 10, .9);
  SONS.renascer();
  return true;
}

// Com as duas bases abertas, os objetivos do meio ficam pretos e sem interação
function neutroTravado(o) { return o.tipo === 'neutro' && estado.portaoAberto.azul && estado.portaoAberto.vermelho; }

// Atualiza os timers de captura (usa delta time em segundos)
function atualizarObjetivos(dt) {
  for (const o of estado.objetivos) {
    if (o.permanente || neutroTravado(o)) { o.progresso = 0; continue; }
    const p = jogadorEm(o.x, o.y);
    if (!p) continue; // sair NÃO zera: o progresso fica guardado
    // Se há progresso de OUTRO time, ao subir ele zera na hora e a contagem recomeça do 0
    // (objetivos da base inimiga NÃO zeram: o defensor pisando ali não apaga o progresso do invasor)
    if (o.tipo === 'neutro' && o.progresso > 0 && o.timeProg !== p.time) o.progresso = 0;
    // dono atual (ou defensor da base) não captura; só zera o progresso adversário (acima)
    if (o.tipo === 'base' && p.time === o.baseDe) continue;
    if (o.dono === p.time) continue;
    o.timeProg = p.time;
    o.progresso += dt;
    if (o.progresso >= TEMPO_CAPTURA) {
      o.dono = p.time; o.progresso = 0;
      p.capturas++;
      const base = o.tipo === 'base';
      if (base) o.permanente = true;
      criarEfeito(o.x, o.y, COR_CLARA[p.time], base ? 30 : 18, base ? 2.2 : 1.5);
      textoFlutuante(o.x, o.y, base ? 'BASE TOMADA!' : 'CAPTURADO!', COR_CLARA[p.time], base ? 18 : 15);
      tremer(base ? .3 : .1);
      SONS.captura();
      verificarRegras();
    }
  }
}

function neutrosDo(time) { return estado.objetivos.filter(o => o.tipo === 'neutro' && o.dono === time).length; }
function totalNeutros() { return estado.objetivos.filter(o => o.tipo === 'neutro').length; }
function baseConquistada(time) { // objetivos da base inimiga na cor de "time"
  return estado.objetivos.filter(o => o.tipo === 'base' && o.baseDe !== time && o.dono === time).length;
}
function totalBase() { return estado.objetivos.filter(o => o.tipo === 'base' && o.baseDe === 'azul').length; }

// Abre portões (nunca fecham) e checa vitória
function verificarRegras() {
  for (const time of ['azul', 'vermelho']) {
    const alvo = INIMIGO[time]; // base cujo portão o "time" abre
    if (neutrosDo(time) === totalNeutros() && !estado.portaoAberto[alvo]) {
      estado.portaoAberto[alvo] = true;
      estado.portaoAbertoEm[alvo] = estado.tempo;
      estado.flash = { t: 1.6, cor: COR[time] };
      anunciar('INVASÃO!', COR_CLARA[time]);
      tremer(.5);
      mostrarAviso(`Portão ${alvo} ABERTO para o time ${time}!`);
      SONS.portao();
    }
    if (!estado.vencedor && baseConquistada(time) === totalBase()) {
      estado.vencedor = time;
      estado.festa = 3; soltarConfete(160);
      if (!iniciado) { estado.reinicio = 3.5; continue; } // demonstração: só recomeça sozinha
      placar[time]++; salvar();
      const nome = time[0].toUpperCase() + time.slice(1);
      const fimTexto = document.getElementById('fimTexto');
      fimTexto.textContent = `Vitória do time ${nome}!`;
      fimTexto.style.color = COR_CLARA[time];
      fimTexto.style.textShadow = `0 0 .5em ${COR[time]}`;
      document.getElementById('fimPlacar').innerHTML =
        `<span style="color:${COR_CLARA.azul}">Azul ${placar.azul}</span> &nbsp;×&nbsp; <span style="color:${COR_CLARA.vermelho}">${placar.vermelho} Vermelho</span>`;
      const mvp = [...estado.jogadores].sort((a, b) => (b.abates + 2 * b.capturas) - (a.abates + 2 * a.capturas))[0];
      document.getElementById('fimStats').innerHTML =
        `Tempo de partida: <b>${fmtTempo(estado.tempo)}</b> &nbsp;·&nbsp; Eliminações: <b>${estado.eliminacoes.azul}</b> a <b>${estado.eliminacoes.vermelho}</b><br>` +
        `⭐ Destaque: <b style="color:${COR_CLARA[mvp.time]}">Jogador ${mvp.num}</b> — ${mvp.capturas} captura(s) e ${mvp.abates} eliminação(ões)`;
      document.getElementById('fim').style.display = 'flex';
      SONS.vitoria();
    }
  }
}

/* ---------- Entrada de teclado ---------- */
const TECLAS = {
  setas: { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] },
  wasd:  { KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] },
};
const segurando = { setas: [], wasd: [] }; // pilha de direções seguradas

function comecar() {
  if (iniciado) return;
  iniciado = true;
  document.body.classList.add('jogando');
  telaCheia();
  document.getElementById('inicio').style.display = 'none';
  iniciarPartida(); // troca a demonstração por uma partida de verdade (com contagem regressiva)
}
// Escolhe o modo de jogo no menu (troca os jogadores, o mapa e a demonstração ao fundo)
function selecionarModo(m) {
  modo = m;
  CONFIG_JOGADORES = MODOS[m].jogadores;
  ehBot = MODOS[m].ehBot;
  document.getElementById('modoTimes').classList.toggle('sel', m === 'times');
  document.getElementById('modoOuro').classList.toggle('sel', m === 'ouro');
  document.getElementById('modoRei').classList.toggle('sel', m === 'rei');
  document.getElementById('modoPega').classList.toggle('sel', m === 'pega');
  document.getElementById('modoSob').classList.toggle('sel', m === 'sob');
  document.getElementById('modoBand').classList.toggle('sel', m === 'band');
  document.getElementById('modoRev').classList.toggle('sel', m === 'rev');
  const cartao = { times: 'modoTimes', ouro: 'modoOuro', rei: 'modoRei', pega: 'modoPega', sob: 'modoSob', band: 'modoBand', rev: 'modoRev' }[m];
  document.getElementById('modoDesc').textContent = document.querySelector(`#${cartao} small`).textContent;
  document.getElementById('inicioCtrl').innerHTML = TOQUE
    ? '<span style="color:#7db4ff">👆 Deslize o dedo na tela para andar &nbsp;<small style="font-weight:600;color:#aeb6cc">(mantenha o dedo na tela para continuar andando)</small></span>'
    : MODOS[m].controlesHTML;
  document.getElementById('inicioPassos').innerHTML = MODOS[m].passos.map(([ic, titulo, texto]) =>
    `<div class="passo"><div class="ic">${ic}</div><b>${titulo}</b><small>${texto}</small></div>`).join('');
  salvar();
  iniciarPartida();
}
// Tecla M: sai da partida e volta para o menu inicial
function voltarMenu() {
  if (!iniciado) return;
  iniciado = false;
  document.body.classList.remove('jogando');
  document.getElementById('inicio').style.display = 'flex';
  iniciarPartida(); // volta a rodar a demonstração
}
function alternarPausa() {
  if (!iniciado || estado.vencedor) return;
  pausado = !pausado;
  document.getElementById('pausa').style.display = pausado ? 'flex' : 'none';
  SONS.pausa();
}
function mudarNivel() {
  nivel = (nivel + 1) % NIVEIS.length; salvar(); atualizarOpcoes();
  mostrarAviso(`Bots: ${N().nome}`);
}
function alternarSom() {
  somLigado = !somLigado; salvar(); atualizarOpcoes();
  mostrarAviso(`Som ${somLigado ? 'ligado' : 'desligado'}`);
  SONS.pausa();
}
function alternarMusica() {
  musicaLigada = !musicaLigada; salvar(); atualizarOpcoes();
  mostrarAviso(`Música ${musicaLigada ? 'ligada' : 'desligada'}`);
}
const jogando = () => iniciado && !pausado && !estado.vencedor && estado.contagem <= 0;


// Uma direção foi apertada (tecla do teclado ou deslize do dedo no celular)
function apertarDirecao(ctrl, codigo) {
  segurando[ctrl].push(codigo);
  // Se o jogador já está livre (cd = 0), move na hora. Se ainda está esperando o tempo entre passos,
  // a direção fica guardada e vale assim que a espera acabar (apertar mais rápido não faz andar mais rápido).
  if (jogando()) for (const p of estado.jogadores) if (p.controle === ctrl && p.morto <= 0) {
    if (p.cd > 0) { p.pendente = codigo; continue; }
    const [dx, dy] = TECLAS[ctrl][codigo];
    tentarMover(p, dx, dy);
    p.cd = delayDe(p); // se continuar segurando, repete depois desse tempo
  }
}

/* ---------- Entrada por toque (celular) ----------
   Deslizar o dedo para cima/baixo/esquerda/direita, em qualquer lugar da tela, move o jogador das "setas".
   Funciona como uma tecla: um deslize curto = 1 passo; deixar o dedo na tela depois do deslize = continuar
   andando (como segurar a tecla); arrastar para outro lado sem soltar = mudar de direção. */
const DESLIZE_MIN = 22; // px que o dedo precisa andar para contar como um deslize
let dedo = null;        // dedo que está controlando: { id, x, y } (x,y = de onde o próximo deslize é medido)


function soltarDedo(e) {
  audio();
  if (!dedo || ![...e.changedTouches].some(t => t.identifier === dedo.id)) return;
  dedo = null;
  segurando.setas = [];
}



// Celular: abre em tela cheia e trava a tela deitada (onde o navegador deixa; no iPhone basta virar o aparelho)
function telaCheia() {
  const el = document.documentElement;
  if (!TOQUE || document.fullscreenElement || !el.requestFullscreen) return;
  el.requestFullscreen()
    .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
    .catch(() => {});
}


// Teclas 1–6: liga/desliga o bot de um jogador
function alternarBotJogador(i) {
  if (i < 0 || i >= ehBot.length) return;
  ehBot[i] = !ehBot[i];
  estado.jogadores[i].controle = controleDe(i);
  mostrarAviso(`Jogador ${i + 1}: ${ehBot[i] ? 'BOT ligado' : (controleConfig(i) === 'nenhum' ? 'parado' : 'manual')}`);
  atualizarPainel();
}
// Tecla B: todos viram bot; apertando de novo volta ao padrão (humanos nos teclados)
function alternarBot() {
  const todosBot = ehBot.every(Boolean);
  CONFIG_JOGADORES.forEach((c, i) => { ehBot[i] = todosBot ? c.controle === 'bot' : true; });
  estado.jogadores.forEach((p, i) => { p.controle = controleDe(i); });
  mostrarAviso(todosBot ? 'Controles padrão' : 'Todos os jogadores como bot');
  atualizarPainel();
}

// Painel HTML com a lista dos 6 jogadores e o controle de cada um
function atualizarPainel() {
  const nomeCtrl = { setas: 'setas', wasd: 'WASD', bot: 'BOT', nenhum: 'parado' };
  document.getElementById('jogadores').innerHTML = CONFIG_JOGADORES.map((c, i) =>
    `<span class="jg" style="color:${COR_CLARA[c.time]};border-color:${COR[c.time]}">${i + 1} · ${nomeCtrl[controleConfig(i)]}</span>`).join('');
}

function atualizarJogadores(dt) {
  for (const p of estado.jogadores) {
    if (p.morto > 0) { // aguardando renascer
      p.morto -= dt;
      if (p.morto <= 0 && !renascer(p)) p.morto = 0.001; // sem lugar livre: tenta de novo no próximo frame
      continue;
    }
    p.cd = Math.max(0, p.cd - dt * 1000);
    if (p.cd > 0 || p.controle === 'nenhum') continue;
    if (p.controle === 'bot') {
      const d = Math.random() < N().erro ? passoAleatorio(p) : M().decidirBot(p);
      if (d) tentarMover(p, d[0], d[1]);
      p.cd = N().delay * M().ritmo * (p.dourado ? DELAY_MOVIMENTO_DOURADO / DELAY_MOVIMENTO * (M().lentidaoDourado || 1) : 1);
      continue;
    }
    const pilha = segurando[p.controle];
    const codigo = pilha[pilha.length - 1] || p.pendente; // tecla segurada, ou a que foi tocada durante a espera
    p.pendente = null;
    if (!codigo) continue;
    const [dx, dy] = TECLAS[p.controle][codigo];
    tentarMover(p, dx, dy);
    p.cd = delayDe(p);
  }
}

/* ---------- Bot simples ---------- */
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// BFS até o alvo mais próximo; devolve o primeiro passo [dx,dy] ou null.
// "evitar" (opcional) é uma função (x, y) que diz quais quadrados o caminho não pode usar.
function primeiroPasso(p, alvos, evitar = null) {
  const chave = (x, y) => y * COLUNAS + x;
  const alvoSet = new Set(alvos.map(a => chave(a.x, a.y)));
  const visto = new Map(); visto.set(chave(p.x, p.y), null);
  const fila = [[p.x, p.y]];
  while (fila.length) {
    const [x, y] = fila.shift();
    if (alvoSet.has(chave(x, y)) && !(x === p.x && y === p.y)) {
      let k = chave(x, y), passo = null;
      while (visto.get(k)) { passo = visto.get(k).dir; k = visto.get(k).de; }
      return passo;
    }
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, k = chave(nx, ny);
      if (visto.has(k) || !terrenoLivre(p.time, nx, ny)) continue;
      if (evitar && evitar(nx, ny)) continue;
      const oc = jogadorEm(nx, ny);
      if (oc && oc.time === p.time && oc !== p) continue; // bot não anda em cima de aliado (evita fogo amigo)
      visto.set(k, { de: chave(x, y), dir: visto.get(chave(x, y)) ? visto.get(chave(x, y)).dir : [dx, dy] });
      fila.push([nx, ny]);
    }
  }
  return null;
}

// Erro do bot (níveis mais fáceis): anda para um lado livre qualquer
function passoAleatorio(p) {
  const op = DIRS.filter(([dx, dy]) => terrenoLivre(p.time, p.x + dx, p.y + dy) && !jogadorEm(p.x + dx, p.y + dy));
  return op.length ? op[Math.floor(Math.random() * op.length)] : null;
}

function decidirBot(p) {
  // 0) DEFESA (prioridade máxima): inimigo dentro da minha base -> volto na hora para expulsá-lo
  const invasores = estado.jogadores.filter(j => j.morto <= 0 && j.time !== p.time && chaoDoTile(tileEm(j.x, j.y)) === p.time);
  if (invasores.length) {
    const colado = invasores.find(j => Math.abs(j.x - p.x) + Math.abs(j.y - p.y) === 1);
    if (colado && Math.random() < N().atqInv) return [colado.x - p.x, colado.y - p.y]; // sobe em cima
    if (!colado) return primeiroPasso(p, invasores);
    // colado mas "dançando": cai no comportamento normal abaixo
  }
  // 1) inimigo a 1 quadrado: ataca ou "dança" para o lado
  const inimigo = estado.jogadores.find(j => j.morto <= 0 && j.time !== p.time && Math.abs(j.x - p.x) + Math.abs(j.y - p.y) === 1);
  if (inimigo) {
    const dx = inimigo.x - p.x, dy = inimigo.y - p.y;
    if (Math.random() < N().atq) return [dx, dy];
    const opcoes = DIRS.filter(([ax, ay]) => (ax !== dx || ay !== dy) && terrenoLivre(p.time, p.x + ax, p.y + ay) && !jogadorEm(p.x + ax, p.y + ay));
    return opcoes.length ? opcoes[Math.floor(Math.random() * opcoes.length)] : null;
  }
  // 2) escolhe os alvos: base inimiga (se portão aberto) ou neutros que ainda não são dele
  const baseInimiga = INIMIGO[p.time];
  const alvos = estado.portaoAberto[baseInimiga]
    ? estado.objetivos.filter(o => o.tipo === 'base' && o.baseDe === baseInimiga && o.dono !== p.time)
    : estado.objetivos.filter(o => o.tipo === 'neutro' && o.dono !== p.time);
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const vivo = j => j.morto <= 0;
  // objetivo "livre" = não é meu e nenhum aliado HUMANO está em cima dele
  const humanos = estado.jogadores.filter(j => vivo(j) && j.time === p.time && j.controle !== 'bot');
  const livres = alvos.filter(a => !humanos.some(h => h.x === a.x && h.y === a.y));
  const bots = estado.jogadores.filter(j => vivo(j) && j.time === p.time && j.controle === 'bot');

  // distribui: cada bot assume UM objetivo livre (quem já está em cima fica com ele; o resto pelo mais perto)
  const reivind = new Map(), tomados = new Set();
  for (const b of bots) {
    const a = livres.find(a => a.x === b.x && a.y === b.y);
    if (a) { reivind.set(b, a); tomados.add(a); }
  }
  const pares = [];
  for (const b of bots) if (!reivind.has(b)) for (const a of livres) if (!tomados.has(a)) pares.push({ b, a, d: dist(b, a) });
  pares.sort((u, v) => u.d - v.d || u.b.num - v.b.num);
  for (const { b, a } of pares) {
    if (reivind.has(b) || tomados.has(a)) continue;
    reivind.set(b, a); tomados.add(a);
  }
  const meu = reivind.get(p);
  if (meu) {
    if (meu.x === p.x && meu.y === p.y) return null; // já está em cima: espera a captura
    const passo = primeiroPasso(p, [meu]) || primeiroPasso(p, livres.filter(a => !tomados.has(a) || a === meu));
    if (passo) return passo;
  }

  // 3) sem objetivo livre para mim: vai atrás de um inimigo que esteja no campo neutro
  const noNeutro = estado.jogadores.filter(j => vivo(j) && j.time !== p.time &&
    (chaoDoTile(tileEm(j.x, j.y)) === 'neutro' || estado.portaoAberto[baseInimiga]));
  if (noNeutro.length) {
    const passo = primeiroPasso(p, noNeutro);
    if (passo) return passo;
  }

  // 4) nenhum inimigo no neutro: fica perto do portão inimigo (quadrados neutros colados nele)
  const letraPortao = baseInimiga === 'vermelho' ? 'r' : 'b';
  const pontos = [];
  for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLUNAS; x++) {
    if (MAPA[y][x] !== letraPortao) continue;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (chaoDoTile(tileEm(nx, ny)) === 'neutro' && terrenoLivre(p.time, nx, ny)) pontos.push({ x: nx, y: ny });
    }
  }
  if (!pontos.length) return null;
  if (pontos.some(q => q.x === p.x && q.y === p.y)) return null; // já está no posto
  const vagos = pontos.filter(q => !bots.some(b => b !== p && b.x === q.x && b.y === q.y));
  return primeiroPasso(p, vagos.length ? vagos : pontos);
}

/* =====================================================================
   MODO TIMES 3x3 — o que é só dele (o resto das regras está acima)
   ===================================================================== */
function timesPreparar() {
  carregarMapa(0);
  for (let y = 0; y < LINHAS; y++) {
    for (let x = 0; x < COLUNAS; x++) {
      const c = MAPA[y][x];
      if (c === 'S') estado.spawns.azul.push({ x, y });
      if (c === 'T') estado.spawns.vermelho.push({ x, y });
      if (c === 'N') estado.objetivos.push(novoObjetivo(x, y, 'neutro', null));
      if (c === 'x') estado.objetivos.push(novoObjetivo(x, y, 'base', 'azul'));
      if (c === 'y') estado.objetivos.push(novoObjetivo(x, y, 'base', 'vermelho'));
    }
  }
}

/* =====================================================================
   MODO CORRIDA DO OURO — todos contra todos
   Pegue o Ouro no centro e leve até a sua base. Usa o movimento, a colisão,
   a eliminação e o renascimento comuns; aqui ficam só as regras do Ouro,
   as paredes que se movem e a IA dos bots.
   ===================================================================== */
// Quadrados do lado de fora de cada porta da caixa: onde os bots esperam ela abrir
const OURO_CENTRO = (() => { // posição do "O" no mapa
  for (let y = 0; y < OURO_MAPA_FECHADO.length; y++) { const x = OURO_MAPA_FECHADO[y].indexOf('O'); if (x >= 0) return { x, y }; }
})();
// Quadrados de dentro da caixa colados numa porta: onde quem está com o Ouro espera a caixa abrir
const OURO_PORTAS_DENTRO = [];
for (let y = OURO_CENTRO.y - 2; y <= OURO_CENTRO.y + 2; y++) for (let x = OURO_CENTRO.x - 2; x <= OURO_CENTRO.x + 2; x++) {
  if (OURO_MAPA_FECHADO[y][x] !== '#' && DIRS.some(([dx, dy]) => naLista(OURO_VIRAM_CHAO, x + dx, y + dy))) OURO_PORTAS_DENTRO.push({ x, y });
}
const OURO_ESPERA = [];
for (const [x, y] of OURO_VIRAM_CHAO) for (const [dx, dy] of DIRS) {
  // "dentro" = interior da caixa (a 2 quadrados do Ouro); só os quadrados de fora servem de espera
  const nx = x + dx, ny = y + dy, dentro = Math.abs(nx - OURO_CENTRO.x) <= 2 && Math.abs(ny - OURO_CENTRO.y) <= 2;
  if (!dentro && OURO_MAPA_FECHADO[ny][nx] === '.') OURO_ESPERA.push({ x: nx, y: ny });
}

function ouroPreparar() {
  MAPA = OURO_MAPA_FECHADO; LINHAS = MAPA.length; COLUNAS = MAPA[0].length;
  estado.paredes = { aberto: false, t: TEMPO_TROCA_PAREDES }; // t = segundos até a próxima troca
  estado.ouro = { x: OURO_CENTRO.x, y: OURO_CENTRO.y, dono: null };                   // dono = jogador que está carregando (null = no centro)
  for (let y = 0; y < LINHAS; y++) {
    for (let x = 0; x < COLUNAS; x++) {
      const c = MAPA[y][x];
      if (c === 'O') { estado.ouro.x = x; estado.ouro.y = y; }
      if (c >= '1' && c <= '6') estado.spawns[CORES_OURO[c - 1]].push({ x, y }); // a base é o ponto de nascimento
    }
  }
}

// Alterna a caixa central entre fechada e aberta a cada TEMPO_TROCA_PAREDES segundos
function ouroAtualizar(dt) {
  const w = estado.paredes;
  w.t -= dt;
  if (w.t > 0) return;
  w.aberto = !w.aberto;
  w.t += TEMPO_TROCA_PAREDES;
  MAPA = w.aberto ? OURO_MAPA_ABERTO : OURO_MAPA_FECHADO;
  SONS.paredes(w.aberto);
  // parede que apareceu em cima de um jogador elimina ele (volta para a base; se era o dourado, o Ouro volta ao centro)
  for (const p of estado.jogadores) if (p.morto <= 0 && tileEm(p.x, p.y) === '#') eliminar(p, null);
}

// O quadrado (x,y) vira parede na próxima troca, e ela acontece em menos de "margem" segundos?
function paredeEmBreve(x, y, margem) {
  const w = estado.paredes;
  return w.t <= margem && naLista(w.aberto ? OURO_VIRAM_CHAO : OURO_VIRAM_PAREDE, x, y);
}

function ouroPegar(p) {
  estado.ouro.dono = p; p.dourado = true;
  criarEfeito(p.x, p.y, DOURADO, 20, 1.6);
  textoFlutuante(p.x, p.y - .6, 'PEGOU O OURO!', DOURADO, 16);
  SONS.ouro();
}
// O Ouro volta para o centro. Se tiver alguém parado lá nesse momento, essa pessoa pega na hora
function ouroVoltarAoCentro() {
  const o = estado.ouro;
  if (o.dono) o.dono.dourado = false;
  o.dono = null;
  const noCentro = jogadorEm(o.x, o.y);
  if (noCentro) ouroPegar(noCentro);
}
// Chamado sempre que um jogador chega num quadrado
function ouroAoMover(p) {
  const o = estado.ouro;
  if (!o.dono && p.x === o.x && p.y === o.y) ouroPegar(p);                                  // pegar: é instantâneo
  else if (p.dourado && tileEm(p.x, p.y) === String(CORES_OURO.indexOf(p.time) + 1)) ouroPontuar(p); // entregar na própria base
}
// Chamado quando um jogador é eliminado (pisado ou esmagado por uma parede)
function ouroAoEliminar(vitima) {
  if (!vitima.dourado) return;
  textoFlutuante(vitima.x, vitima.y - .7, 'PERDEU O OURO!', DOURADO, 15);
  ouroVoltarAoCentro();
}
function ouroPontuar(p) {
  p.pontos++; p.capturas++;
  ouroVoltarAoCentro();
  criarEfeito(p.x, p.y, DOURADO, 30, 2.2);
  textoFlutuante(p.x, p.y, '+1 PONTO!', DOURADO, 18);
  tremer(.2);
  SONS.captura();
  mostrarAviso(`${NOME[p.time]} pontuou! (${p.pontos}/${PONTOS_PARA_VENCER})`);
  if (p.pontos >= PONTOS_PARA_VENCER) ouroVitoria(p);
}
function ouroVitoria(p) {
  estado.vencedor = p.time;
  estado.festa = 3; soltarConfete(160);
  if (!iniciado) { estado.reinicio = 3.5; return; } // demonstração: só recomeça sozinha
  const fimTexto = document.getElementById('fimTexto');
  fimTexto.textContent = `${NOME[p.time]} venceu!`;
  fimTexto.style.color = COR_CLARA[p.time];
  fimTexto.style.textShadow = `0 0 .5em ${COR[p.time]}`;
  // ranking dos 6 jogadores: mais pontos primeiro; no empate, mais eliminações
  const ordem = [...estado.jogadores].sort((a, b) => b.pontos - a.pontos || b.abates - a.abates || a.num - b.num);
  document.getElementById('fimPlacar').innerHTML = '<div class="rank">' + ordem.map((j, i) =>
    `<div class="rl"><span>${i + 1}º</span><span><span class="dot" style="display:block;background:${COR[j.time]}"></span></span>` +
    `<span style="color:${COR_CLARA[j.time]}">${NOME[j.time]} · Jogador ${j.num}</span>` +
    `<span>${j.pontos} pt${j.pontos === 1 ? '' : 's'}</span><span>${j.abates} elim.</span></div>`).join('') + '</div>';
  document.getElementById('fimStats').innerHTML = `Tempo de partida: <b>${fmtTempo(estado.tempo)}</b>`;
  document.getElementById('fim').style.display = 'flex';
  SONS.vitoria();
}

/* IA simples dos bots da Corrida do Ouro (caminhos por BFS na grade):
   - Ouro no centro: vai até ele (se a caixa estiver fechada, espera ao lado de uma porta).
   - Outro jogador dourado: persegue para subir em cima dele.
   - Ele mesmo dourado: volta para a base pelo caminho mais curto, desviando de inimigos a 1 quadrado. */
function decidirBotOuro(p) {
  const o = estado.ouro;
  // Folga que o bot exige antes de pisar num quadrado que vai virar parede. Quem não tem o Ouro arrisca mais;
  // quem carrega o Ouro tem mais a perder, então arrisca menos.
  const margem = N().delay * M().ritmo / 1000 * (p.dourado ? 1 : .25);
  const perigo = (x, y) => paredeEmBreve(x, y, margem);
  const dist = (j, x, y) => Math.abs(j.x - x) + Math.abs(j.y - y);
  const inimigos = estado.jogadores.filter(j => j !== p && j.morto <= 0);
  let passo = null;

  if (p.dourado) {
    // Com o Ouro o bot nunca fica parado à toa: ele se defende dos adversários o tempo todo.
    const base = estado.spawns[p.time];
    const pertoDeInimigo = (x, y) => inimigos.some(j => dist(j, x, y) <= 1);
    const colados = inimigos.filter(j => dist(j, p.x, p.y) === 1);
    const livres = DIRS.filter(([dx, dy]) => terrenoLivre(p.time, p.x + dx, p.y + dy) && !perigo(p.x + dx, p.y + dy) && !jogadorEm(p.x + dx, p.y + dy));
    const sorteia = lista => lista[Math.floor(Math.random() * lista.length)];

    // 1) adversário colado: pisa nele (continua com o Ouro) — na maioria das vezes
    const vitima = colados.find(j => terrenoLivre(p.time, j.x, j.y) && !perigo(j.x, j.y));
    if (vitima && Math.random() < Math.max(.65, N().atqInv)) return [vitima.x - p.x, vitima.y - p.y];

    // 2) caminho mais curto para a base, desviando dos inimigos (sem desvio possível: vai assim mesmo)
    passo = primeiroPasso(p, base, (x, y) => perigo(x, y) || pertoDeInimigo(x, y)) || primeiroPasso(p, base, perigo);
    if (passo) return passo;

    // 3) sem caminho (preso na caixa fechada): foge de quem está colado, ou se posiciona junto a uma porta
    const seguros = livres.filter(([dx, dy]) => !pertoDeInimigo(p.x + dx, p.y + dy));
    if (colados.length && seguros.length) return sorteia(seguros);
    if (vitima) return [vitima.x - p.x, vitima.y - p.y];
    if (!OURO_PORTAS_DENTRO.some(q => q.x === p.x && q.y === p.y)) {
      const ate = primeiroPasso(p, OURO_PORTAS_DENTRO, perigo);
      if (ate) return ate;
    }
    // já está na porta: se algum inimigo se aproxima (a 2 quadrados), recua para o lado mais afastado deles
    if (inimigos.some(j => dist(j, p.x, p.y) <= 2) && livres.length) {
      const folga = ([dx, dy]) => Math.min(...inimigos.map(j => dist(j, p.x + dx, p.y + dy)));
      return livres.reduce((a, b) => folga(b) > folga(a) ? b : a);
    }
    return null; // espera a porta abrir, de olho nos adversários
  } else {
    // Quem não tem o Ouro precisa arriscar: ataca quem estiver colado, persegue o dourado e entra na caixa sem esperar a hora "segura".
    const alvo = o.dono || o; // persegue o dourado, ou vai buscar o Ouro no centro
    const livre = j => terrenoLivre(p.time, j.x, j.y);
    // 1) dourado colado: pisa nele sem pensar (ignora até o risco da parede)
    if (o.dono && dist(o.dono, p.x, p.y) === 1 && livre(o.dono)) return [o.dono.x - p.x, o.dono.y - p.y];
    // 2) qualquer outro adversário colado: ataca na maioria das vezes
    const colado = inimigos.find(j => dist(j, p.x, p.y) === 1 && livre(j) && !perigo(j.x, j.y));
    if (colado && Math.random() < Math.max(.85, N().atq)) return [colado.x - p.x, colado.y - p.y];
    // 3) papéis (só entre bots): os bots dividem o trabalho em vez de todos fazerem a mesma coisa
    const bots = estado.jogadores.filter(j => j.morto <= 0 && j.controle === 'bot' && !j.dourado);
    const maisPerto = (lista, x, y) => lista.slice().sort((a, b) => dist(a, x, y) - dist(b, x, y) || a.num - b.num);
    const passoSeg = N().delay * M().ritmo / 1000; // duração de um passo, em segundos
    if (!o.dono) {
      // --- Ouro no centro: os 2 bots mais próximos são LADRÕES; os outros caçam adversários ---
      if (maisPerto(bots, o.x, o.y).indexOf(p) < 2) {
        const w = estado.paredes;
        const dentro = Math.abs(p.x - OURO_CENTRO.x) <= 2 && Math.abs(p.y - OURO_CENTRO.y) <= 2;
        const naPorta = OURO_ESPERA.some(q => Math.abs(q.x - p.x) + Math.abs(q.y - p.y) <= 1);
        // espera junto à porta e só entra quando a caixa acabou de abrir (sobra tempo para passar a porta antes de fechar)
        if (dentro || (naPorta && w.aberto && w.t >= passoSeg * 1.7)) passo = primeiroPasso(p, [o], (x, y) => paredeEmBreve(x, y, passoSeg * .3));
        else if (!OURO_ESPERA.some(q => q.x === p.x && q.y === p.y)) passo = primeiroPasso(p, OURO_ESPERA, perigo);
        if (!passo && (dentro || naPorta)) return null; // posicionado: espera a hora certa
      } else passo = primeiroPasso(p, inimigos, perigo); // caçador
    } else {
      // --- Ouro com alguém: o bot mais próximo PERSEGUE; os 2 mais próximos da base dele fazem EMBOSCADA na entrada ---
      const c = o.dono, perseguidor = maisPerto(bots, c.x, c.y)[0];
      if (p === perseguidor) passo = primeiroPasso(p, [c], perigo);
      else {
        const b = estado.spawns[c.time][0];
        const entradas = DIRS.map(([dx, dy]) => ({ x: b.x + dx, y: b.y + dy }))
          .filter(q => tileEm(q.x, q.y) !== '#' && !(tileEm(q.x, q.y) >= '1' && tileEm(q.x, q.y) <= '6'));
        if (entradas.length && maisPerto(bots.filter(j => j !== perseguidor), b.x, b.y).indexOf(p) < EMBOSCADORES) {
          if (entradas.some(q => q.x === p.x && q.y === p.y)) return null; // de tocaia: o dono do Ouro tem que passar por aqui
          passo = primeiroPasso(p, entradas, perigo);
        } else passo = primeiroPasso(p, [c], perigo);
      }
    }
    // 4) sem plano possível: caça o adversário mais próximo, ou espera do lado de fora de uma porta
    if (!passo) passo = primeiroPasso(p, inimigos, perigo);
    if (!passo && !OURO_ESPERA.some(q => q.x === p.x && q.y === p.y)) passo = primeiroPasso(p, OURO_ESPERA, perigo);
  }
  // está em cima de um quadrado que vai virar parede e não tem para onde ir pelo plano: foge para qualquer lado seguro
  if (!passo && perigo(p.x, p.y)) {
    const op = DIRS.filter(([dx, dy]) => terrenoLivre(p.time, p.x + dx, p.y + dy) && !perigo(p.x + dx, p.y + dy));
    passo = op.find(([dx, dy]) => !jogadorEm(p.x + dx, p.y + dy)) || op[0] || null;
  }
  return passo;
}

/* =====================================================================
   MODO REI DA COLINA — todos contra todos
   Uma zona 3x3 (a colina) pula de lugar a cada TEMPO_TROCA_COLINA segundos. Quem está SOZINHO nela soma
   tempo; com dois ou mais dentro ninguém soma. Quem chegar a TEMPO_PARA_VENCER_REI segundos vence.
   Usa o movimento, a eliminação e o renascimento comuns; aqui ficam só a colina, a vitória e a IA.
   ===================================================================== */
// Legenda igual à da Corrida do Ouro: # parede | . chão | 1 a 6 base (e nascimento) de cada jogador
// Legenda igual à da Corrida do Ouro: # parede | . chão | 1 a 6 base (e nascimento) de cada jogador
const REI_MAPA = [
  "#####################",
  "#####1#.......#2#####",
  "###...............###",
  "##...#.........#...##",
  "##.................##",
  "#.....#.......#.....#",
  "6...................3",
  "#.....#.......#.....#",
  "##.................##",
  "##...#.........#...##",
  "###...............###",
  "#####5#.......#4#####",
  "#####################",
];
// Centros possíveis da colina (a zona é o 3x3 em volta). A primeira é a do centro, onde a partida começa.
const REI_COLINAS = [{ x: 10, y: 6 }, { x: 10, y: 3 }, { x: 10, y: 9 }, { x: 4, y: 6 }, { x: 16, y: 6 }];
const reiNaZona = (c, j) => Math.abs(j.x - c.x) <= 1 && Math.abs(j.y - c.y) <= 1;
function reiTiles(c) {
  const l = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) l.push({ x: c.x + dx, y: c.y + dy });
  return l;
}
function reiSortearProxima(idx) { // próximo lugar da colina: qualquer um menos o atual
  let n;
  do n = Math.floor(Math.random() * REI_COLINAS.length); while (n === idx);
  return n;
}

function reiPreparar() {
  MAPA = REI_MAPA; LINHAS = MAPA.length; COLUNAS = MAPA[0].length;
  for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLUNAS; x++) {
    const c = MAPA[y][x];
    if (c >= '1' && c <= '6') estado.spawns[CORES_OURO[c - 1]].push({ x, y }); // a base é o ponto de nascimento
  }
  // t = segundos até a troca | prox = índice do próximo lugar | dono = quem está sozinho nela | disputa = 2 ou mais dentro
  estado.colina = { x: REI_COLINAS[0].x, y: REI_COLINAS[0].y, idx: 0, prox: reiSortearProxima(0), t: TEMPO_TROCA_COLINA, dono: null, disputa: false };
}

function reiAtualizar(dt) {
  const c = estado.colina;
  c.t -= dt;
  if (c.t <= 0) { // a colina pula para o lugar que estava piscando
    const n = REI_COLINAS[c.prox];
    c.x = n.x; c.y = n.y; c.idx = c.prox; c.prox = reiSortearProxima(c.idx); c.t += TEMPO_TROCA_COLINA;
    anunciar('NOVA COLINA!', '#ffd84d');
    SONS.colina();
  }
  const dentro = estado.jogadores.filter(j => j.morto <= 0 && reiNaZona(c, j));
  c.disputa = dentro.length > 1;
  c.dono = dentro.length === 1 ? dentro[0] : null;
  if (!c.dono || estado.vencedor) return;
  const p = c.dono, antes = Math.floor(p.tempoColina);
  p.tempoColina += dt;
  if (Math.floor(p.tempoColina) > antes) {
    SONS.tique();
    textoFlutuante(p.x, p.y - .7, Math.floor(p.tempoColina) + 's', COR_CLARA[p.time], 14);
  }
  if (p.tempoColina >= TEMPO_PARA_VENCER_REI) { p.tempoColina = TEMPO_PARA_VENCER_REI; reiVitoria(p); }
}

function reiVitoria(p) {
  estado.vencedor = p.time;
  estado.festa = 3; soltarConfete(160);
  if (!iniciado) { estado.reinicio = 3.5; return; } // demonstração: só recomeça sozinha
  const fimTexto = document.getElementById('fimTexto');
  fimTexto.textContent = `${NOME[p.time]} é o Rei da Colina!`;
  fimTexto.style.color = COR_CLARA[p.time];
  fimTexto.style.textShadow = `0 0 .5em ${COR[p.time]}`;
  // ranking dos 6 jogadores: mais tempo na colina primeiro; no empate, mais eliminações
  const ordem = [...estado.jogadores].sort((a, b) => b.tempoColina - a.tempoColina || b.abates - a.abates || a.num - b.num);
  document.getElementById('fimPlacar').innerHTML = '<div class="rank">' + ordem.map((j, i) =>
    `<div class="rl"><span>${i + 1}º</span><span><span class="dot" style="display:block;background:${COR[j.time]}"></span></span>` +
    `<span style="color:${COR_CLARA[j.time]}">${NOME[j.time]} · Jogador ${j.num}</span>` +
    `<span>${Math.floor(j.tempoColina)} s</span><span>${j.abates} elim.</span></div>`).join('') + '</div>';
  document.getElementById('fimStats').innerHTML = `Tempo de partida: <b>${fmtTempo(estado.tempo)}</b>`;
  document.getElementById('fim').style.display = 'flex';
  SONS.vitoria();
}

/* IA simples dos bots do Rei da Colina (caminhos por BFS na grade):
   - Fora da zona: vai até ela (nos últimos segundos, já vai para o próximo lugar).
   - Dentro e sozinho: fica parado somando tempo.
   - Dentro com intruso: vai pisar nele.
   - Adversário colado: ataca; senão "dança", de preferência sem sair da zona. */
function decidirBotRei(p) {
  const c = estado.colina;
  const alvo = c.t <= TEMPO_AVISO_COLINA - .5 ? REI_COLINAS[c.prox] : c; // zona que o bot quer ocupar
  const inimigos = estado.jogadores.filter(j => j !== p && j.morto <= 0);
  const colado = inimigos.find(j => Math.abs(j.x - p.x) + Math.abs(j.y - p.y) === 1);
  if (colado) {
    const dx = colado.x - p.x, dy = colado.y - p.y;
    if (Math.random() < N().atq) return [dx, dy];
    const op = DIRS.filter(([ax, ay]) => (ax !== dx || ay !== dy) && terrenoLivre(p.time, p.x + ax, p.y + ay) && !jogadorEm(p.x + ax, p.y + ay));
    const dentro = op.filter(([ax, ay]) => reiNaZona(alvo, { x: p.x + ax, y: p.y + ay }));
    const lista = dentro.length ? dentro : op;
    return lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;
  }
  if (!reiNaZona(alvo, p)) return primeiroPasso(p, reiTiles(alvo));
  const intrusos = inimigos.filter(j => reiNaZona(alvo, j));
  return intrusos.length ? primeiroPasso(p, intrusos) : null;
}

/* =====================================================================
   MODO PEGA-PEGA DO OURO — todos contra todos
   O Ouro começa no centro. Quem o segura soma tempo; quem PISAR em quem o segura rouba o Ouro na hora.
   Quem somar TEMPO_PARA_VENCER_PEGA segundos com o Ouro vence. Usa o mapa do Rei da Colina, o movimento,
   a eliminação e o renascimento comuns; aqui ficam só a posse do Ouro, a vitória e a IA.
   ===================================================================== */
// Arena pequena (15x11), só deste modo. Mesma legenda: # parede | . chão | 1 a 6 base (e nascimento) de cada jogador.
// As 6 bases ficam a 7 passos do centro.
const PEGA_MAPA = [
  "###############",
  "####1#####2####",
  "##...........##",
  "##...#...#...##",
  "#.............#",
  "6.............3",
  "#.............#",
  "##...#...#...##",
  "##...........##",
  "####5#####4####",
  "###############",
];
const PEGA_CENTRO = { x: 7, y: 5 }; // onde o Ouro começa

function pegaPreparar() {
  MAPA = PEGA_MAPA; LINHAS = MAPA.length; COLUNAS = MAPA[0].length;
  for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLUNAS; x++) {
    const c = MAPA[y][x];
    if (c >= '1' && c <= '6') estado.spawns[CORES_OURO[c - 1]].push({ x, y }); // a base é o ponto de nascimento
  }
  estado.ouro = { x: PEGA_CENTRO.x, y: PEGA_CENTRO.y, dono: null }; // dono = quem está com o Ouro (null = no chão)
}

function pegaPegar(p) { // pegar o Ouro do chão: instantâneo
  estado.ouro.dono = p; p.dourado = true;
  criarEfeito(p.x, p.y, DOURADO, 20, 1.6);
  textoFlutuante(p.x, p.y - .6, 'PEGOU O OURO!', DOURADO, 16);
  SONS.ouro();
}
function pegaAoMover(p) {
  const o = estado.ouro;
  if (!o.dono && p.x === o.x && p.y === o.y) pegaPegar(p);
}
// Quem estava com o Ouro foi eliminado: o Ouro passa para quem pisou nele (sem ninguém, volta ao centro)
function pegaAoEliminar(vitima, algoz) {
  if (!vitima.dourado) return;
  vitima.dourado = false;
  const o = estado.ouro;
  if (algoz) {
    o.dono = algoz; algoz.dourado = true;
    criarEfeito(vitima.x, vitima.y, DOURADO, 26, 1.8);
    textoFlutuante(vitima.x, vitima.y - .7, 'ROUBOU O OURO!', DOURADO, 16);
    SONS.ouro();
  } else {
    o.dono = null; o.x = PEGA_CENTRO.x; o.y = PEGA_CENTRO.y;
    const noCentro = jogadorEm(o.x, o.y);
    if (noCentro) pegaPegar(noCentro);
  }
}

function pegaAtualizar(dt) {
  const p = estado.ouro.dono;
  if (!p || estado.vencedor) return;
  const antes = Math.floor(p.tempoOuro);
  p.tempoOuro += dt;
  if (Math.floor(p.tempoOuro) > antes) {
    SONS.tique();
    textoFlutuante(p.x, p.y - .7, Math.floor(p.tempoOuro) + 's', DOURADO, 14);
  }
  if (p.tempoOuro >= TEMPO_PARA_VENCER_PEGA) { p.tempoOuro = TEMPO_PARA_VENCER_PEGA; pegaVitoria(p); }
}

function pegaVitoria(p) {
  estado.vencedor = p.time;
  estado.festa = 3; soltarConfete(160);
  if (!iniciado) { estado.reinicio = 3.5; return; } // demonstração: só recomeça sozinha
  const fimTexto = document.getElementById('fimTexto');
  fimTexto.textContent = `${NOME[p.time]} segurou o Ouro!`;
  fimTexto.style.color = COR_CLARA[p.time];
  fimTexto.style.textShadow = `0 0 .5em ${COR[p.time]}`;
  // ranking dos 6 jogadores: mais tempo com o Ouro primeiro; no empate, mais eliminações
  const ordem = [...estado.jogadores].sort((a, b) => b.tempoOuro - a.tempoOuro || b.abates - a.abates || a.num - b.num);
  document.getElementById('fimPlacar').innerHTML = '<div class="rank">' + ordem.map((j, i) =>
    `<div class="rl"><span>${i + 1}º</span><span><span class="dot" style="display:block;background:${COR[j.time]}"></span></span>` +
    `<span style="color:${COR_CLARA[j.time]}">${NOME[j.time]} · Jogador ${j.num}</span>` +
    `<span>${Math.floor(j.tempoOuro)} s</span><span>${j.abates} elim.</span></div>`).join('') + '</div>';
  document.getElementById('fimStats').innerHTML = `Tempo de partida: <b>${fmtTempo(estado.tempo)}</b>`;
  document.getElementById('fim').style.display = 'flex';
  SONS.vitoria();
}

// Distância (em passos) de cada quadrado até o inimigo mais próximo: busca em largura saindo de todos os inimigos
function pegaDistancias(inimigos) {
  const d = new Map(), fila = [];
  for (const j of inimigos) { d.set(j.y * COLUNAS + j.x, 0); fila.push([j.x, j.y]); }
  for (let i = 0; i < fila.length; i++) {
    const [x, y] = fila[i], dv = d.get(y * COLUNAS + x);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, c = tileEm(nx, ny), k = ny * COLUNAS + nx;
      if (c === '#' || (c >= '1' && c <= '6') || d.has(k)) continue; // parede ou base de alguém
      d.set(k, dv + 1); fila.push([nx, ny]);
    }
  }
  return d;
}

/* IA simples dos bots do Pega-Pega do Ouro:
   - Ouro no chão: vai buscar.
   - Ouro com outro jogador: persegue e pisa nele.
   - Com o Ouro: pisa em quem estiver colado; senão foge para o quadrado mais distante dos inimigos. */
function decidirBotPega(p) {
  const o = estado.ouro;
  const dist = (j, x, y) => Math.abs(j.x - x) + Math.abs(j.y - y);
  const inimigos = estado.jogadores.filter(j => j !== p && j.morto <= 0);
  const colado = inimigos.find(j => dist(j, p.x, p.y) === 1);
  if (p.dourado) {
    if (colado && Math.random() < Math.max(.65, N().atqInv)) return [colado.x - p.x, colado.y - p.y]; // se defende pisando (continua com o Ouro)
    const d = pegaDistancias(inimigos);
    let melhor = -1, escolhas = [];
    for (const [dx, dy] of DIRS) {
      if (!terrenoLivre(p.time, p.x + dx, p.y + dy) || jogadorEm(p.x + dx, p.y + dy)) continue;
      const v = d.get((p.y + dy) * COLUNAS + p.x + dx) ?? 99;
      if (v > melhor) { melhor = v; escolhas = [[dx, dy]]; } else if (v === melhor) escolhas.push([dx, dy]);
    }
    if (escolhas.length) return escolhas[Math.floor(Math.random() * escolhas.length)];
    return colado ? [colado.x - p.x, colado.y - p.y] : null; // encurralado: pisa em quem estiver colado
  }
  // sem o Ouro: o portador colado é pisado sem pensar; qualquer outro colado, na maioria das vezes
  if (colado && (colado === o.dono || Math.random() < Math.max(.85, N().atq))) return [colado.x - p.x, colado.y - p.y];
  return primeiroPasso(p, [o.dono || o]);
}

/* =====================================================================
   MODO SOBREVIVÊNCIA — todos contra todos, sem renascer
   Quem é eliminado sai da partida. De tempos em tempos o anel de fora da arena vira parede (os quadrados piscam
   antes) e quem estiver nele é esmagado. O último jogador vivo vence. Usa o movimento e a eliminação comuns;
   aqui ficam a zona que fecha, a vitória, o ranking e a IA dos bots.
   ===================================================================== */
// Arena 17x11 só deste modo. # parede | . chão. Os pontos de nascimento ficam em SOB_NASCE (todos no 2º anel,
// a 6 passos do centro), e não há bases: ninguém tem um lugar seguro.
const SOB_MAPA = [
  "#################",
  "#...............#",
  "#.......#.......#",
  "#...............#",
  "#...#.......#...#",
  "#...............#",
  "#...#.......#...#",
  "#...............#",
  "#.......#.......#",
  "#...............#",
  "#################",
];
const SOB_NASCE = [{ x: 5, y: 2 }, { x: 11, y: 2 }, { x: 14, y: 5 }, { x: 11, y: 8 }, { x: 5, y: 8 }, { x: 2, y: 5 }]; // jogadores 1 a 6
const SOB_CENTRO = { x: 8, y: 5 };
const SOB_ULTIMO_ANEL = 6; // fecham os "anéis" 0 a 6; o quadrado do centro nunca fecha
// "Anel" de um quadrado = em que ordem ele fecha. 0 a 3: os anéis de fora para dentro. Sobra a fileira do meio,
// que fecha a partir das pontas (4 = as duas pontas, 5 = as seguintes, 6 = as seguintes) até restar só o centro:
// assim a partida sempre termina, mesmo que todo mundo fique se esquivando.
const sobAnel = (x, y) => {
  const r = Math.min(x - 1, 15 - x, y - 1, 9 - y);
  return r < 4 ? r : 4 + 3 - Math.abs(x - SOB_CENTRO.x);
};

function sobPreparar() {
  MAPA = SOB_MAPA.slice(); LINHAS = MAPA.length; COLUNAS = MAPA[0].length; // cópia: a zona vai mudando o mapa
  CORES_OURO.forEach((cor, i) => { estado.spawns[cor] = [SOB_NASCE[i]]; });
  // ring = próximo anel a fechar | t = segundos até fechar | aviso = quadrados piscando | fim = não há mais anéis
  estado.zona = { ring: 0, t: TEMPO_INICIO_ZONA, aviso: false, avisou: false, fim: false };
}

const sobVivos = () => estado.jogadores.filter(j => j.morto <= 0);

// Quadrados que o bot considera perigosos: o anel que vai fechar, já um pouco antes de piscar
const sobPerigo = (x, y) => { const z = estado.zona; return !z.fim && z.t <= TEMPO_AVISO_ZONA + 1.5 && sobAnel(x, y) <= z.ring; };

function sobFecharAnel() {
  const z = estado.zona;
  MAPA = MAPA.map((l, y) => [...l].map((c, x) => c !== '#' && sobAnel(x, y) === z.ring ? '#' : c).join(''));
  z.ring++; z.avisou = z.aviso = false;
  if (z.ring > SOB_ULTIMO_ANEL) { z.fim = true; z.t = 0; } else z.t = z.ring >= 4 ? TEMPO_ZONA_FINAL : TEMPO_ENTRE_ZONA;
  tremer(.4); SONS.paredes(false);
  for (const p of estado.jogadores) if (p.morto <= 0 && tileEm(p.x, p.y) === '#') eliminar(p, null); // esmagado pela parede
}

function sobAtualizar(dt) {
  const z = estado.zona;
  if (!estado.vencedor && !z.fim) {
    z.t -= dt;
    z.aviso = z.t <= TEMPO_AVISO_ZONA;
    if (z.aviso && !z.avisou) { z.avisou = true; anunciar('ZONA FECHANDO!', '#ff8a8a'); SONS.colina(); }
    if (z.t <= 0) sobFecharAnel();
  }
  const vivos = sobVivos();
  if (!estado.vencedor && vivos.length <= 1) sobVitoria(vivos[0] || null); // nenhum vivo = todos esmagados juntos (empate)
}
function sobAoEliminar(vitima) { vitima.tempoElim = estado.tempo; }

function sobVitoria(p) {
  estado.vencedor = p ? p.time : 'empate';
  estado.festa = 3; soltarConfete(160);
  if (!iniciado) { estado.reinicio = 3.5; return; } // demonstração: só recomeça sozinha
  const fimTexto = document.getElementById('fimTexto');
  fimTexto.textContent = p ? `${NOME[p.time]} sobreviveu!` : 'Empate!';
  fimTexto.style.color = p ? COR_CLARA[p.time] : '#fff';
  fimTexto.style.textShadow = `0 0 .5em ${p ? COR[p.time] : '#8ea0ff'}`;
  // ranking: o vivo primeiro; depois quem durou mais; no empate, mais eliminações
  const ordem = [...estado.jogadores].sort((a, b) => (b.morto <= 0) - (a.morto <= 0) || b.tempoElim - a.tempoElim || b.abates - a.abates || a.num - b.num);
  document.getElementById('fimPlacar').innerHTML = '<div class="rank">' + ordem.map((j, i) =>
    `<div class="rl"><span>${i + 1}º</span><span><span class="dot" style="display:block;background:${COR[j.time]}"></span></span>` +
    `<span style="color:${COR_CLARA[j.time]}">${NOME[j.time]} · Jogador ${j.num}</span>` +
    `<span>${j.morto <= 0 ? 'vivo' : Math.floor(j.tempoElim) + ' s'}</span><span>${j.abates} elim.</span></div>`).join('') + '</div>';
  document.getElementById('fimStats').innerHTML = `Tempo de partida: <b>${fmtTempo(estado.tempo)}</b>`;
  document.getElementById('fim').style.display = 'flex';
  SONS.vitoria();
}

/* IA simples dos bots da Sobrevivência: quem corre para cima dos outros se dá mal, então eles se esquivam
   e deixam a zona apertar o cerco.
   - Em quadrado que vai fechar: corre para o centro, que nunca fecha.
   - Adversário colado: ataca (às vezes).
   - Senão: fica no quadrado vizinho (ou onde está) mais longe dos adversários, com uma leve preferência pelo
     centro. A zona fechando vai encurralando todo mundo. */
function decidirBotSob(p) {
  const inimigos = sobVivos().filter(j => j !== p);
  if (!inimigos.length) return null;
  if (sobPerigo(p.x, p.y)) {
    const passo = primeiroPasso(p, [SOB_CENTRO]);
    if (passo) return passo;
  }
  const colado = inimigos.find(j => Math.abs(j.x - p.x) + Math.abs(j.y - p.y) === 1);
  if (colado && Math.random() < N().atq && !sobPerigo(colado.x, colado.y)) return [colado.x - p.x, colado.y - p.y];
  const d = pegaDistancias(inimigos); // passos de cada quadrado até o adversário mais próximo
  const valor = (x, y) => (d.get(y * COLUNAS + x) ?? 20) - .3 * (Math.abs(x - SOB_CENTRO.x) + Math.abs(y - SOB_CENTRO.y)) + Math.random() * .6;
  let melhor = valor(p.x, p.y) + .4, passo = null; // ficar parado ganha um bônus para eles não ficarem agitados à toa
  for (const [dx, dy] of DIRS) {
    const nx = p.x + dx, ny = p.y + dy;
    if (!terrenoLivre(p.time, nx, ny) || jogadorEm(nx, ny) || sobPerigo(nx, ny)) continue;
    const v = valor(nx, ny);
    if (v > melhor) { melhor = v; passo = [dx, dy]; }
  }
  return passo;
}

// Os quadrados do próximo anel ganham um tom avermelhado; nos últimos segundos, piscam forte
function sobDesenharChao(T) {
  const z = estado.zona; if (z.fim) return;
  ctx.save(); ctx.fillStyle = '#ff5a4d'; ctx.globalAlpha = .07;
  for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLUNAS; x++)
    if (MAPA[y][x] !== '#' && sobAnel(x, y) === z.ring) ctx.fillRect(x * T + 1, y * T + 1, T - 2, T - 2);
  ctx.restore();
}
function sobDesenharAvisos(T) {
  const z = estado.zona; if (z.fim || !z.aviso) return;
  const pisca = .5 + .5 * Math.sin(agoraS * 28), alt = Math.round(T * .14);
  ctx.save();
  for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLUNAS; x++) {
    if (MAPA[y][x] === '#' || sobAnel(x, y) !== z.ring) continue;
    const px = x * T, py = y * T;
    ctx.globalAlpha = .3 + .4 * pisca; ctx.fillStyle = '#2b3478'; ctx.fillRect(px, py - alt, T, T);
    ctx.globalAlpha = .35 + .5 * pisca; ctx.fillStyle = 'rgba(255,70,70,.55)'; ctx.fillRect(px, py - alt, T, T);
    ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,120,120,${.5 + .5 * pisca})`; ctx.strokeRect(px + 1, py - alt + 1, T - 2, T - 2);
  }
  ctx.restore();
}

// HUD da Sobrevivência: os 6 jogadores (vivo ou fora), quantos restam e o tempo até a zona fechar
function hudSob() {
  const e = estado, W = tela.width, x0 = 14, w = 150, gap = 6, y = 8, h = 66, z = e.zona;
  ctx.textBaseline = 'middle';
  e.jogadores.forEach((p, i) => {
    const x = x0 + i * (w + gap), vivo = p.morto <= 0;
    ctx.save();
    if (!vivo) ctx.globalAlpha = .45;
    ctx.fillStyle = 'rgba(255,255,255,.055)'; rr(x, y, w, h, 10); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.stroke();
    ctx.fillStyle = COR[p.time]; rr(x + 8, y + 8, 24, 24, 7); ctx.fill();
    ctx.textAlign = 'center'; ctx.font = `900 14px ${FONTE}`; ctx.fillStyle = '#fff'; ctx.fillText(p.num, x + 20, y + 21);
    ctx.textAlign = 'left'; ctx.font = `800 13px ${FONTE}`; ctx.fillStyle = COR_CLARA[p.time]; ctx.fillText(NOME[p.time].toUpperCase(), x + 40, y + 21);
    ctx.font = `900 12px ${FONTE}`; ctx.fillStyle = vivo ? '#4dff9a' : '#ff8a8a';
    ctx.fillText(vivo ? 'NA ARENA' : `FORA · ${Math.floor(p.tempoElim)}s`, x + 9, y + 48);
    ctx.textAlign = 'right'; ctx.font = `800 11px ${FONTE}`; ctx.fillStyle = '#8f97b3'; ctx.fillText(`${p.abates} ELIM.`, x + w - 9, y + 48);
    ctx.restore();
  });
  const bx = x0 + 6 * (w + gap) + 12, bw = W - bx - 18, vivos = sobVivos().length;
  ctx.textAlign = 'left'; ctx.font = `700 10px ${FONTE}`; ctx.fillStyle = '#7c849f'; ctx.fillText('RESTAM', bx, 15);
  ctx.font = `italic 900 20px ${FONTE}`; ctx.fillStyle = '#fff'; ctx.fillText(`${vivos} VIVO${vivos === 1 ? '' : 'S'}`, bx, 36);
  ctx.textAlign = 'right'; ctx.font = `700 13px ${FONTE}`; ctx.fillStyle = '#c5cde3'; ctx.fillText(fmtTempo(e.tempo), bx + bw, 36);
  const total = z.ring === 0 ? TEMPO_INICIO_ZONA : z.ring >= 4 ? TEMPO_ZONA_FINAL : TEMPO_ENTRE_ZONA;
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(bx, 52, bw, 9);
  ctx.fillStyle = z.fim ? '#ff6b6b' : z.aviso ? (Math.sin(agoraS * 28) > 0 ? '#ffd84d' : '#ff6b6b') : '#ff9a6b';
  ctx.fillRect(bx, 52, bw * (z.fim ? 1 : Math.max(0, Math.min(1, z.t / total))), 9);
  ctx.textAlign = 'left'; ctx.font = `700 11px ${FONTE}`; ctx.fillStyle = z.aviso || z.fim ? '#ffd84d' : '#7c849f';
  ctx.fillText(z.fim ? 'ZONA FINAL' : `zona fecha em ${Math.max(0, z.t).toFixed(1)}s`, bx, 72);
}

/* =====================================================================
   MODO BANDEIRA — Times 3x3 (Azul contra Vermelho)
   Cada time tem uma bandeira na sua base. Pise na bandeira do inimigo para pegá-la e leve até o quadrado da
   sua própria bandeira para marcar 1 captura. Quem carrega a bandeira e é eliminado a derruba no chão: o time
   dono pisa nela para devolvê-la à base, o inimigo pisa para pegá-la, ou ela volta sozinha depois de um tempo.
   Vence quem fizer PONTOS_PARA_VENCER_BAND capturas. Usa a grade, o movimento, a eliminação e o renascimento comuns.
   ===================================================================== */
// Legenda do Times 3x3: # parede | . chão neutro | B/R chão da base | S/T nascimento azul/vermelho (3 de cada)
// x/y = onde fica a bandeira azul/vermelha. A arena é simétrica (girando 180° dá o outro lado).
const BAND_MAPA = [
  "#########################",
  "#BBBBB#...........#RRRRR#",
  "#BBBBBB...........RRRRRR#",
  "#SBBBB#...#...#...#RRRRT#",
  "#BBBBB#.....#.....#RRRRR#",
  "#SBxBBB...........RRRyRT#",
  "#BBBBB#.....#.....#RRRRR#",
  "#SBBBB#...#...#...#RRRRT#",
  "#BBBBBB...........RRRRRR#",
  "#BBBBB#...........#RRRRR#",
  "#########################",
];

function bandNovaBandeira(time, x, y) { // x,y = base (casa); cx,cy não mudam, x,y acompanham a bandeira
  return { time, cx: x, cy: y, x, y, dono: null, emCasa: true, soltaT: 0 };
}
function bandVoltarCasa(f) { f.x = f.cx; f.y = f.cy; f.dono = null; f.emCasa = true; f.soltaT = 0; f.pisouPor = null; }

function bandPreparar() {
  MAPA = BAND_MAPA; LINHAS = MAPA.length; COLUNAS = MAPA[0].length;
  estado.bandeiras = {};
  for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLUNAS; x++) {
    const c = MAPA[y][x];
    if (c === 'S') estado.spawns.azul.push({ x, y });
    if (c === 'T') estado.spawns.vermelho.push({ x, y });
    if (c === 'x') estado.bandeiras.azul = bandNovaBandeira('azul', x, y);
    if (c === 'y') estado.bandeiras.vermelho = bandNovaBandeira('vermelho', x, y);
  }
  estado.pontosBand = { azul: 0, vermelho: 0 };
}

function bandPegar(p, f) { // p pisou na bandeira do outro time
  f.dono = p; f.emCasa = false; p.dourado = true; p.bandeira = f.time;
  criarEfeito(p.x, p.y, COR_CLARA[f.time], 18, 1.5);
  textoFlutuante(p.x, p.y - .6, 'PEGOU A BANDEIRA!', COR_CLARA[f.time], 15);
  anunciar('BANDEIRA ROUBADA!', COR_CLARA[p.time]);
  mostrarAviso(`Bandeira ${f.time} roubada pelo time ${p.time}!`);
  SONS.portao();
}
function bandDevolver(p, f) { // alguém do time dono pisou na bandeira caída
  bandVoltarCasa(f);
  criarEfeito(p.x, p.y, COR_CLARA[f.time], 14, 1.2);
  textoFlutuante(p.x, p.y - .6, 'BANDEIRA DEVOLVIDA!', COR_CLARA[f.time], 15);
  SONS.renascer();
}
function bandPontuar(p) { // chegou na própria base com a bandeira inimiga
  bandVoltarCasa(estado.bandeiras[p.bandeira]);
  p.dourado = false; p.bandeira = null; p.capturas++;
  const n = ++estado.pontosBand[p.time];
  criarEfeito(p.x, p.y, COR_CLARA[p.time], 30, 2.2);
  textoFlutuante(p.x, p.y, 'CAPTURA!', COR_CLARA[p.time], 18);
  tremer(.25); SONS.captura();
  mostrarAviso(`${NOME[p.time]} capturou a bandeira! (${n}/${PONTOS_PARA_VENCER_BAND})`);
  if (n >= PONTOS_PARA_VENCER_BAND) bandVitoria(p.time);
}
// Um jogador chegou num quadrado
function bandAoMover(p) {
  const fp = estado.bandeiras[p.time], fi = estado.bandeiras[INIMIGO[p.time]];
  // quem acabou de pisar no portador (e por isso parou em cima da bandeira que caiu) só mexe nela no passo seguinte
  const recem = [fp, fi].filter(f => f.pisouPor === p);
  for (const f of recem) f.pisouPor = null;
  if (p.dourado && p.x === fp.cx && p.y === fp.cy) { bandPontuar(p); return; } // entregar
  if (!recem.includes(fp) && !fp.dono && !fp.emCasa && p.x === fp.x && p.y === fp.y) bandDevolver(p, fp); // devolver a minha, caída
  if (!recem.includes(fi) && !p.dourado && !fi.dono && p.x === fi.x && p.y === fi.y) bandPegar(p, fi);    // pegar a do inimigo
}
// Quem carregava a bandeira foi eliminado: ela cai no chão, no quadrado onde ele estava
function bandAoEliminar(vitima, algoz) {
  if (!vitima.dourado) return;
  const f = estado.bandeiras[vitima.bandeira];
  f.pisouPor = algoz || null;
  f.dono = null; f.x = vitima.x; f.y = vitima.y;
  f.emCasa = f.x === f.cx && f.y === f.cy; f.soltaT = f.emCasa ? 0 : TEMPO_BANDEIRA_VOLTA;
  vitima.dourado = false; vitima.bandeira = null;
  textoFlutuante(vitima.x, vitima.y - .7, 'BANDEIRA CAIU!', COR_CLARA[f.time], 15);
}
function bandAtualizar(dt) { // bandeira caída volta sozinha para a base
  for (const f of Object.values(estado.bandeiras)) {
    if (f.emCasa || f.dono) continue;
    f.soltaT -= dt;
    if (f.soltaT <= 0) { criarEfeito(f.x, f.y, COR_CLARA[f.time], 10, 1); bandVoltarCasa(f); textoFlutuante(f.cx, f.cy, 'BANDEIRA DE VOLTA', COR_CLARA[f.time], 13); }
  }
}

function bandVitoria(time) {
  estado.vencedor = time;
  estado.festa = 3; soltarConfete(160);
  if (!iniciado) { estado.reinicio = 3.5; return; } // demonstração: só recomeça sozinha
  const nome = NOME[time], pt = estado.pontosBand;
  const fimTexto = document.getElementById('fimTexto');
  fimTexto.textContent = `Vitória do time ${nome}!`;
  fimTexto.style.color = COR_CLARA[time];
  fimTexto.style.textShadow = `0 0 .5em ${COR[time]}`;
  document.getElementById('fimPlacar').innerHTML =
    `<span style="color:${COR_CLARA.azul}">Azul ${pt.azul}</span> &nbsp;×&nbsp; <span style="color:${COR_CLARA.vermelho}">${pt.vermelho} Vermelho</span>`;
  const mvp = [...estado.jogadores].sort((a, b) => (b.abates + 2 * b.capturas) - (a.abates + 2 * a.capturas))[0];
  document.getElementById('fimStats').innerHTML =
    `Tempo de partida: <b>${fmtTempo(estado.tempo)}</b> &nbsp;·&nbsp; Eliminações: <b>${estado.eliminacoes.azul}</b> a <b>${estado.eliminacoes.vermelho}</b><br>` +
    `⭐ Destaque: <b style="color:${COR_CLARA[mvp.time]}">Jogador ${mvp.num}</b> — ${mvp.capturas} captura(s) e ${mvp.abates} eliminação(ões)`;
  document.getElementById('fim').style.display = 'flex';
  SONS.vitoria();
}

/* IA simples dos bots da Bandeira (caminhos por BFS na grade):
   - Com a bandeira inimiga: volta para a própria base desviando de inimigos; pisa em quem estiver colado.
   - O bot mais perto de uma bandeira minha caída (ou com o inimigo) vai atrás dela.
   - O bot mais perto da bandeira inimiga vai pegá-la (ataque).
   - Os outros fazem a defesa: perseguem quem chega perto da minha bandeira, senão ficam de guarda. */
function decidirBotBand(p) {
  const fp = estado.bandeiras[p.time], fi = estado.bandeiras[INIMIGO[p.time]];
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const vivos = estado.jogadores.filter(j => j.morto <= 0);
  const inimigos = vivos.filter(j => j.time !== p.time);
  const colado = inimigos.find(j => dist(j, p) === 1);
  const casa = { x: fp.cx, y: fp.cy };
  if (p.dourado) {
    if (colado && Math.random() < Math.max(.65, N().atqInv)) return [colado.x - p.x, colado.y - p.y];
    const perto = (x, y) => inimigos.some(j => Math.abs(j.x - x) + Math.abs(j.y - y) <= 1);
    return primeiroPasso(p, [casa], perto) || primeiroPasso(p, [casa]);
  }
  if (colado && Math.random() < N().atq) return [colado.x - p.x, colado.y - p.y];
  const aliados = vivos.filter(j => j.time === p.time && j.controle === 'bot' && !j.dourado);
  const posto = (a, o) => a.slice().sort((u, v) => dist(u, o) - dist(v, o) || u.num - v.num).indexOf(p); // 0 = o mais perto de o
  // ir até uma bandeira. Se já está em cima dela sem ter mexido (acabou de pisar no portador), sai e volta
  const ir = (alvo, evitar) => (p.x === alvo.x && p.y === alvo.y)
    ? (DIRS.find(([dx, dy]) => terrenoLivre(p.time, p.x + dx, p.y + dy) && !jogadorEm(p.x + dx, p.y + dy)) || null)
    : (primeiroPasso(p, [alvo], evitar) || primeiroPasso(p, [alvo]));
  if (fp.dono && posto(aliados, fp.dono) === 0) return primeiroPasso(p, [fp.dono]);                   // recuperar a minha
  if (!fp.dono && !fp.emCasa && posto(aliados, fp) === 0) return ir(fp);                              // devolver a minha
  // atacar: todos os bots menos um (o que fica na defesa) vão buscar a bandeira inimiga, desviando de quem está perto do caminho
  if (!fi.dono && posto(aliados, fi) < Math.max(1, aliados.length - 1))
    return ir(fi, (x, y) => inimigos.some(j => Math.abs(j.x - x) + Math.abs(j.y - y) <= 1));
  const ameaca = inimigos.filter(j => dist(j, casa) <= 5);
  if (ameaca.length) return primeiroPasso(p, ameaca);                                                // defender
  return dist(p, casa) <= 2 ? null : primeiroPasso(p, [casa]);                                       // guarda
}

// Bandeirinha: mastro com pano ondulando. (cx, cy) = pé do mastro; s = tamanho
function desenharBandeira(cx, cy, s, cor, fase = 0) {
  const onda = Math.sin(agoraS * 6 + fase) * s * .12;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#e8ecff'; ctx.lineWidth = Math.max(2, s * .1);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - s * 1.9); ctx.stroke();
  ctx.fillStyle = cor; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 1.9);
  ctx.quadraticCurveTo(cx + s * .9, cy - s * 1.75 + onda, cx + s * 1.5, cy - s * 1.45 + onda);
  ctx.quadraticCurveTo(cx + s * .8, cy - s * 1.2 - onda, cx, cy - s * .95);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Chão: a casa de cada bandeira (tracejada quando ela está fora) e as bandeiras que estão no chão
function bandDesenharChao(T) {
  for (const time of ['azul', 'vermelho']) {
    const f = estado.bandeiras[time];
    ctx.save();
    ctx.globalAlpha = .6; ctx.fillStyle = COR_ESCURA[time]; rr(f.cx * T + 2, f.cy * T + 2, T - 4, T - 4, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.lineWidth = 2.5; ctx.strokeStyle = COR_CLARA[time];
    if (!f.emCasa) ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();
    if (f.dono) continue; // quem carrega mostra a bandeirinha em cima de si
    const bx = (f.x + .5) * T - T * .12, by = (f.y + .5) * T + T * .3 + Math.sin(agoraS * 3 + f.cx) * T * .02;
    desenharBandeira(bx, by, T * .3, COR[time], f.cx);
    if (!f.emCasa) { // anel de tempo para voltar sozinha
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = COR_CLARA[time];
      ctx.beginPath(); ctx.arc((f.x + .5) * T, (f.y + .5) * T, T * .46, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, f.soltaT) / TEMPO_BANDEIRA_VOLTA); ctx.stroke();
      ctx.restore();
    }
  }
}

// HUD da Bandeira: um painel por time (estado da bandeira, capturas e eliminações) e o placar no meio
function hudBand() {
  const e = estado, W = tela.width;
  painelBand('azul', 22, 1);
  painelBand('vermelho', W - 22, -1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 10px ${FONTE}`; ctx.fillStyle = '#7c849f'; ctx.fillText('C A P T U R A S', W / 2, 11);
  ctx.font = `900 38px ${FONTE}`;
  ctx.fillStyle = COR_CLARA.azul; ctx.fillText(e.pontosBand.azul, W / 2 - 48, 39);
  ctx.fillStyle = COR_CLARA.vermelho; ctx.fillText(e.pontosBand.vermelho, W / 2 + 48, 39);
  ctx.font = `900 20px ${FONTE}`; ctx.fillStyle = '#5d6585'; ctx.fillText('×', W / 2, 38);
  ctx.font = `700 13px ${FONTE}`; ctx.fillStyle = '#c5cde3'; ctx.fillText(fmtTempo(e.tempo), W / 2, 68);
}
function painelBand(time, x, d) { // d = 1 desenha da esquerda para a direita; d = -1 espelhado
  const e = estado, f = e.bandeiras[time];
  ctx.textAlign = d === 1 ? 'left' : 'right'; ctx.textBaseline = 'middle';
  ctx.font = `italic 900 22px ${FONTE}`; ctx.fillStyle = COR_CLARA[time];
  ctx.fillText(time.toUpperCase(), x, 19);
  ctx.font = `800 11px ${FONTE}`;
  ctx.fillStyle = f.dono ? '#ff6b6b' : f.emCasa ? '#7c849f' : '#ffd84d';
  ctx.fillText(f.dono ? 'BANDEIRA ROUBADA!' : f.emCasa ? 'BANDEIRA EM CASA' : `BANDEIRA CAÍDA · ${Math.ceil(f.soltaT)}s`, x + d * 136, 20);
  ctx.fillStyle = '#7c849f'; ctx.fillText('CAPTURAS', x, 44);
  for (let i = 0; i < PONTOS_PARA_VENCER_BAND; i++) estrela(x + d * (80 + i * 22), 44, 8, i < e.pontosBand[time] ? '#ffd84d' : '#3d4570');
  ctx.fillStyle = '#8f97b3'; ctx.fillText(`${e.eliminacoes[time]} ELIMINAÇÕES`, x, 68);
}

/* =====================================================================
   MODO REVEZAMENTO DE OBJETIVOS — Times 3x3 (Azul contra Vermelho)
   Um objetivo por vez acende, em ordem aleatória, num dos 7 lugares do mapa (o novo lugar pisca antes). O time
   que ficar na zona 3x3 sem nenhum adversário dentro enche a barra de captura (mais jogadores = mais rápido) e
   marca 1 ponto; com os dois times dentro a captura pausa. Objetivo que ninguém captura apaga e muda de lugar.
   Vence quem fizer PONTOS_PARA_VENCER_REV pontos. Usa a grade, o movimento, a eliminação e o renascimento comuns.
   ===================================================================== */
// Legenda do Times 3x3: # parede | . chão neutro | B/R chão da base | S/T nascimento azul/vermelho (3 de cada)
// N = lugar possível do objetivo (7). Simétrico: girando 180° dá o outro lado. Cada zona é o 3x3 em volta do N.
const REV_MAPA = [
  "#######################",
  "#BBB...............RRR#",
  "#BBB.......N.......RRR#",
  "#SBB..N....#....N..RRT#",
  "#BBB....#.....#....RRR#",
  "#SBB.......N.......RRT#",
  "#BBB....#.....#....RRR#",
  "#SBB..N....#....N..RRT#",
  "#BBB.......N.......RRR#",
  "#BBB...............RRR#",
  "#######################",
];

function revPreparar() {
  MAPA = REV_MAPA; LINHAS = MAPA.length; COLUNAS = MAPA[0].length;
  const alvos = [];
  for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLUNAS; x++) {
    const c = MAPA[y][x];
    if (c === 'S') estado.spawns.azul.push({ x, y });
    if (c === 'T') estado.spawns.vermelho.push({ x, y });
    if (c === 'N') alvos.push({ x, y });
  }
  const centro = alvos.findIndex(a => a.x === 11 && a.y === 5);
  // fase: 'espera' (o lugar pisca) | 'ativo' (dá para capturar) | t = segundos até mudar de fase | prog = barra de captura
  estado.rev = { alvos, atual: centro, ultimo: -1, fase: 'espera', t: TEMPO_ESPERA_REV, prog: 0, progTime: null,
                 dentro: { azul: 0, vermelho: 0 }, disputa: false, pontos: { azul: 0, vermelho: 0 } };
}

function revProximo() { // sorteia o próximo lugar (nunca o atual nem o anterior)
  const r = estado.rev;
  const opcoes = r.alvos.map((_, i) => i).filter(i => i !== r.atual && i !== r.ultimo);
  r.ultimo = r.atual; r.atual = opcoes[Math.floor(Math.random() * opcoes.length)];
  r.fase = 'espera'; r.t = TEMPO_ESPERA_REV; r.prog = 0; r.progTime = null; r.dentro = { azul: 0, vermelho: 0 }; r.disputa = false;
}

function revAtualizar(dt) {
  const r = estado.rev;
  if (estado.vencedor) return;
  r.t -= dt;
  if (r.fase === 'espera') {
    if (r.t <= 0) { r.fase = 'ativo'; r.t = TEMPO_OBJ_EXPIRA; anunciar('OBJETIVO ATIVO!', '#ffd84d'); SONS.colina(); }
    return;
  }
  const a = r.alvos[r.atual];
  const dentro = estado.jogadores.filter(j => j.morto <= 0 && reiNaZona(a, j));
  r.dentro = { azul: dentro.filter(j => j.time === 'azul').length, vermelho: dentro.filter(j => j.time === 'vermelho').length };
  r.disputa = r.dentro.azul > 0 && r.dentro.vermelho > 0;
  const time = r.disputa ? null : r.dentro.azul > 0 ? 'azul' : r.dentro.vermelho > 0 ? 'vermelho' : null;
  if (time) {
    if (r.progTime && r.progTime !== time) r.prog = 0; // o outro time chegou: a barra recomeça do zero
    r.progTime = time;
    r.prog += dt * (1 + .5 * (r.dentro[time] - 1));    // 1 jogador = normal, 2 = 1,5x, 3 = 2x
    if (r.prog >= TEMPO_CAPTURA_REV) { revCapturar(time, dentro.filter(j => j.time === time)); return; }
  } else if (!r.disputa) r.prog = Math.max(0, r.prog - dt * .5); // zona vazia: a barra vai escorrendo
  if (r.t <= 0) { textoFlutuante(a.x, a.y, 'EXPIROU', '#c5cde3', 16); revProximo(); }
}

function revCapturar(time, membros) {
  const r = estado.rev, a = r.alvos[r.atual], n = ++r.pontos[time];
  membros.forEach(j => j.capturas++);
  criarEfeito(a.x, a.y, COR_CLARA[time], 30, 2.4);
  textoFlutuante(a.x, a.y - .6, 'CAPTURADO!', COR_CLARA[time], 18);
  tremer(.2); SONS.captura();
  mostrarAviso(`${NOME[time]} capturou o objetivo! (${n}/${PONTOS_PARA_VENCER_REV})`);
  if (n >= PONTOS_PARA_VENCER_REV) revVitoria(time); else revProximo();
}

function revVitoria(time) {
  estado.vencedor = time;
  estado.festa = 3; soltarConfete(160);
  if (!iniciado) { estado.reinicio = 3.5; return; } // demonstração: só recomeça sozinha
  const pt = estado.rev.pontos;
  const fimTexto = document.getElementById('fimTexto');
  fimTexto.textContent = `Vitória do time ${NOME[time]}!`;
  fimTexto.style.color = COR_CLARA[time];
  fimTexto.style.textShadow = `0 0 .5em ${COR[time]}`;
  document.getElementById('fimPlacar').innerHTML =
    `<span style="color:${COR_CLARA.azul}">Azul ${pt.azul}</span> &nbsp;×&nbsp; <span style="color:${COR_CLARA.vermelho}">${pt.vermelho} Vermelho</span>`;
  const mvp = [...estado.jogadores].sort((a, b) => (b.abates + 2 * b.capturas) - (a.abates + 2 * a.capturas))[0];
  document.getElementById('fimStats').innerHTML =
    `Tempo de partida: <b>${fmtTempo(estado.tempo)}</b> &nbsp;·&nbsp; Eliminações: <b>${estado.eliminacoes.azul}</b> a <b>${estado.eliminacoes.vermelho}</b><br>` +
    `⭐ Destaque: <b style="color:${COR_CLARA[mvp.time]}">Jogador ${mvp.num}</b> — ${mvp.capturas} captura(s) e ${mvp.abates} eliminação(ões)`;
  document.getElementById('fim').style.display = 'flex';
  SONS.vitoria();
}

/* IA simples dos bots do Revezamento (caminhos por BFS na grade):
   - Os bots mais perto do objetivo (todos menos um) vão para a zona, esperam nela e expulsam quem entrar.
   - O outro bot marca o adversário que estiver perto da zona.
   - Adversário colado: ataca. Enquanto o novo lugar pisca, todos já vão para perto dele. */
function decidirBotRev(p) {
  const r = estado.rev, a = r.alvos[r.atual];
  const dist = (u, v) => Math.abs(u.x - v.x) + Math.abs(u.y - v.y);
  const vivos = estado.jogadores.filter(j => j.morto <= 0);
  const inimigos = vivos.filter(j => j.time !== p.time);
  const colado = inimigos.find(j => dist(j, p) === 1);
  if (colado && Math.random() < N().atq) return [colado.x - p.x, colado.y - p.y];
  const aliados = vivos.filter(j => j.time === p.time && j.controle === 'bot');
  const posto = aliados.slice().sort((u, v) => dist(u, a) - dist(v, a) || u.num - v.num).indexOf(p); // 0 = o mais perto do objetivo
  const naZona = reiNaZona(a, p);
  if (posto < Math.max(1, aliados.length - 1)) { // capturar
    if (!naZona) return primeiroPasso(p, reiTiles(a));
    const intrusos = inimigos.filter(j => reiNaZona(a, j));
    return intrusos.length ? primeiroPasso(p, intrusos) : null;
  }
  const perto = inimigos.filter(j => dist(j, a) <= 6); // apoio
  if (perto.length) return primeiroPasso(p, perto);
  return naZona ? null : primeiroPasso(p, reiTiles(a));
}

// Chão: os lugares possíveis (losangos apagados), o novo lugar piscando e a zona ativa com a barra de captura
function revDesenharChao(T) {
  const r = estado.rev, pulso = .5 + .5 * Math.sin(agoraS * 3);
  ctx.save();
  r.alvos.forEach((al, i) => { // os outros lugares possíveis
    if (i === r.atual) return;
    const cx = (al.x + .5) * T, cy = (al.y + .5) * T, d = T * .16;
    ctx.globalAlpha = .28; ctx.fillStyle = '#aeb6cc';
    ctx.beginPath(); ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy); ctx.closePath(); ctx.fill();
  });
  ctx.restore();
  const a = r.alvos[r.atual], px = (a.x - 1) * T, py = (a.y - 1) * T, L = 3 * T, cx = (a.x + .5) * T, cy = (a.y + .5) * T;
  ctx.save();
  if (r.fase === 'espera') { // aparece piscando, com a contagem para acender
    const pisca = .5 + .5 * Math.sin(agoraS * 14);
    ctx.globalAlpha = .12 + .2 * pisca; ctx.fillStyle = DOURADO; ctx.fillRect(px + 1, py + 1, L - 2, L - 2);
    ctx.globalAlpha = .6 + .4 * pisca; ctx.lineWidth = 3; ctx.strokeStyle = DOURADO; ctx.setLineDash([8, 6]); rr(px + 2, py + 2, L - 4, L - 4, 10); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.font = `900 ${Math.round(T * .9)}px ${FONTE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(Math.ceil(r.t), cx, cy); ctx.fillStyle = DOURADO; ctx.fillText(Math.ceil(r.t), cx, cy);
    ctx.restore(); return;
  }
  const cor = r.disputa ? '#ff6b6b' : r.progTime ? COR[r.progTime] : '#c5cde3';
  const clara = r.disputa ? '#ff9a9a' : r.progTime ? COR_CLARA[r.progTime] : '#e6edff';
  ctx.globalAlpha = .16 + .1 * pulso; ctx.fillStyle = cor; ctx.fillRect(px + 1, py + 1, L - 2, L - 2);
  ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.strokeStyle = clara; ctx.shadowColor = cor; ctx.shadowBlur = 10 + 10 * pulso;
  if (r.t <= 5) ctx.strokeStyle = Math.sin(agoraS * 20) > 0 ? '#ffd84d' : clara; // vai expirar
  if (!r.progTime) { ctx.setLineDash([10, 7]); ctx.lineDashOffset = -agoraS * 20; }
  rr(px + 2, py + 2, L - 4, L - 4, 10); ctx.stroke();
  ctx.setLineDash([]); ctx.shadowBlur = 0;
  // anel de captura no centro da zona
  const ra = T * 1.15, fr = Math.min(1, r.prog / TEMPO_CAPTURA_REV);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(cx, cy, ra, 0, TAU); ctx.stroke();
  if (fr > 0) { ctx.strokeStyle = clara; ctx.lineWidth = 5; ctx.shadowColor = clara; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(cx, cy, ra, -Math.PI / 2, -Math.PI / 2 + TAU * fr); ctx.stroke(); }
  ctx.restore();
}

// HUD do Revezamento: um painel por time (pontos e eliminações) e o estado do objetivo no meio
function hudRev() {
  const e = estado, r = e.rev, W = tela.width;
  painelRev('azul', 22, 1);
  painelRev('vermelho', W - 22, -1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 10px ${FONTE}`; ctx.fillStyle = '#7c849f'; ctx.fillText('P O N T O S', W / 2, 11);
  ctx.font = `900 38px ${FONTE}`;
  ctx.fillStyle = COR_CLARA.azul; ctx.fillText(r.pontos.azul, W / 2 - 48, 39);
  ctx.fillStyle = COR_CLARA.vermelho; ctx.fillText(r.pontos.vermelho, W / 2 + 48, 39);
  ctx.font = `900 20px ${FONTE}`; ctx.fillStyle = '#5d6585'; ctx.fillText('×', W / 2, 38);
  ctx.font = `700 12px ${FONTE}`;
  ctx.fillStyle = r.fase === 'espera' ? '#ffd84d' : r.t <= 5 ? '#ff8a8a' : '#c5cde3';
  ctx.fillText(r.fase === 'espera' ? 'novo objetivo...' : `objetivo muda em ${Math.ceil(r.t)}s`, W / 2, 68);
}
function painelRev(time, x, d) { // d = 1 desenha da esquerda para a direita; d = -1 espelhado
  const e = estado, r = e.rev;
  ctx.textAlign = d === 1 ? 'left' : 'right'; ctx.textBaseline = 'middle';
  ctx.font = `italic 900 22px ${FONTE}`; ctx.fillStyle = COR_CLARA[time];
  ctx.fillText(time.toUpperCase(), x, 19);
  const n = r.dentro[time];
  ctx.font = `800 11px ${FONTE}`;
  ctx.fillStyle = n > 0 ? (r.disputa ? '#ff8a8a' : '#4dff9a') : '#7c849f';
  ctx.fillText(n > 0 ? (r.disputa ? 'DISPUTANDO!' : `NA ZONA (${n})`) : 'FORA DA ZONA', x + d * 136, 20);
  ctx.fillStyle = '#7c849f'; ctx.fillText('PONTOS', x, 44);
  for (let i = 0; i < PONTOS_PARA_VENCER_REV; i++) estrela(x + d * (66 + i * 22), 44, 8, i < r.pontos[time] ? '#ffd84d' : '#3d4570');
  ctx.fillStyle = '#8f97b3'; ctx.fillText(`${e.eliminacoes[time]} ELIMINAÇÕES`, x, 68);
}

/* =====================================================================
   MODOS DE JOGO — um objeto por modo, com as regras específicas.
   O que é comum (movimento, colisão, eliminação, renascimento, bots por BFS,
   desenho da grade e dos bonecos) chama estas funções nos pontos certos.
   ===================================================================== */
const MODOS = {
  times: {
    nome: 'Times 3x3',
    tempoRenascer: TEMPO_RENASCER,
    ritmo: RITMO_OURO,                // multiplicador do tempo entre passos (o mesmo da Corrida do Ouro)
    passos: [ // tutorial mostrado no menu: [ícone, título, texto]
      ['🎯', '1. Domine o meio', 'Fique 5 segundos em cima de cada objetivo neutro para capturá-lo.'],
      ['🚪', '2. Invada a base', 'Com todos os neutros, o portão inimigo abre. Tome os objetivos de lá para vencer.'],
      ['👟', '3. Pise sem dó', 'Subir em cima de um jogador o elimina por alguns segundos. Cuidado: vale para aliados!'],
    ],
    jogadores: JOGADORES_TIMES,
    ehBot: JOGADORES_TIMES.map(c => c.controle === 'bot'),
    controlesHTML: '<span style="color:#7db4ff">AZUL &nbsp;<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span>' +
                   '<span style="color:#ff8f8f">VERMELHO &nbsp;<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></span>',
    preparar: timesPreparar,          // carrega o mapa e monta spawns/objetivos
    atualizar: atualizarObjetivos,    // a cada frame (captura dos objetivos)
    decidirBot: decidirBot,           // IA dos bots
    aoMover() {},                     // um jogador chegou num quadrado
    aoEliminar() {},                  // um jogador foi eliminado
    musicaRapida: () => estado.portaoAberto.azul || estado.portaoAberto.vermelho,
    desenharChao() {},                // desenho extra por cima do chão (antes das paredes)
    desenharAvisos() {},              // desenho extra por cima das paredes
    desenharHUD: () => hudTimes(),
  },
  ouro: {
    nome: 'Corrida do Ouro',
    tempoRenascer: TEMPO_RENASCER_OURO,
    ritmo: RITMO_OURO,
    passos: [
      ['🏆', '1. Pegue o Ouro', 'Pise no quadrado do Ouro, no centro da caixa. É instantâneo, e você fica dourado.'],
      ['🏠', '2. Leve para a sua base', 'Entre na sua base com o Ouro para marcar 1 ponto. Quem fizer 3 pontos primeiro vence.'],
      ['🧱', '3. Cuidado com as paredes', 'A caixa abre e fecha a cada 1 s. Parede em cima de você elimina, e quem perde o Ouro o devolve ao centro.'],
    ],
    jogadores: JOGADORES_OURO,
    ehBot: JOGADORES_OURO.map(c => c.controle === 'bot'),
    controlesHTML: '<span style="color:#7db4ff">JOGADOR 1 &nbsp;<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span>' +
                   '<span style="color:#ff8f8f">JOGADOR 2 &nbsp;<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> &nbsp;<small style="font-weight:600;color:#aeb6cc">(tecla 2 liga/desliga)</small></span>',
    preparar: ouroPreparar,
    atualizar: ouroAtualizar,
    decidirBot: decidirBotOuro,
    aoMover: ouroAoMover,
    aoEliminar: ouroAoEliminar,
    musicaRapida: () => !!estado.ouro.dono,
    desenharChao: T => ouroDesenharChao(T),
    desenharAvisos: T => ouroDesenharAvisos(T),
    desenharHUD: () => hudOuro(),
  },
  rei: {
    nome: 'Rei da Colina',
    tempoRenascer: TEMPO_RENASCER_REI,
    ritmo: RITMO_OURO,
    passos: [
      ['👑', '1. Suba na colina', 'Fique sozinho na zona brilhante (3x3) para somar tempo. Com dois jogadores dentro, ninguém soma.'],
      ['⏱️', '2. Some 20 segundos', 'O primeiro a juntar 20 s na colina vence. O tempo fica guardado quando você sai.'],
      ['🔀', '3. Ela muda de lugar', 'A cada 20 s a colina pula para outro ponto, e o próximo pisca antes. Pise nos rivais para expulsá-los!'],
    ],
    jogadores: JOGADORES_OURO,
    ehBot: JOGADORES_OURO.map(c => c.controle === 'bot'),
    controlesHTML: '<span style="color:#7db4ff">JOGADOR 1 &nbsp;<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span>' +
                   '<span style="color:#ff8f8f">JOGADOR 2 &nbsp;<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> &nbsp;<small style="font-weight:600;color:#aeb6cc">(tecla 2 liga/desliga)</small></span>',
    preparar: reiPreparar,
    atualizar: reiAtualizar,
    decidirBot: decidirBotRei,
    aoMover() {},
    aoEliminar() {},
    musicaRapida: () => estado.jogadores.some(j => j.tempoColina >= TEMPO_PARA_VENCER_REI * .7),
    desenharChao: T => reiDesenharChao(T),
    desenharAvisos: T => reiDesenharAvisos(T),
    desenharHUD: () => hudRei(),
  },
  pega: {
    nome: 'Pega-Pega do Ouro',
    tempoRenascer: TEMPO_RENASCER_PEGA,
    ritmo: RITMO_OURO,
    lentidaoDourado: LENTIDAO_OURO_PEGA,
    passos: [
      ['🏃', '1. Pegue o Ouro', 'Pise no Ouro, no centro do mapa. Enquanto você o segura, o seu tempo corre.'],
      ['💥', '2. Roube pisando', 'Quem pisar em você fica com o Ouro. Pise em quem o segura para roubá-lo de volta!'],
      ['⏱️', '3. Some 20 segundos', 'O primeiro a somar 20 s com o Ouro vence. O tempo fica guardado quando você o perde.'],
    ],
    jogadores: JOGADORES_OURO,
    ehBot: JOGADORES_OURO.map(c => c.controle === 'bot'),
    controlesHTML: '<span style="color:#7db4ff">JOGADOR 1 &nbsp;<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span>' +
                   '<span style="color:#ff8f8f">JOGADOR 2 &nbsp;<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> &nbsp;<small style="font-weight:600;color:#aeb6cc">(tecla 2 liga/desliga)</small></span>',
    preparar: pegaPreparar,
    atualizar: pegaAtualizar,
    decidirBot: decidirBotPega,
    aoMover: pegaAoMover,
    aoEliminar: pegaAoEliminar,
    musicaRapida: () => !!estado.ouro.dono,
    desenharChao: T => ouroDesenharChao(T, false), // bases (sem o anel de entrega) e o Ouro no chão
    desenharAvisos() {},
    desenharHUD: () => hudPega(),
  },
  sob: {
    nome: 'Sobrevivência',
    tempoRenascer: Infinity,          // quem é eliminado não volta
    ritmo: RITMO_OURO,
    passos: [
      ['⚔️', '1. Sem segunda chance', 'Não há renascimento: quem for eliminado sai da partida. Pise nos rivais para tirá-los do jogo.'],
      ['🔥', '2. A arena encolhe', 'De tempos em tempos a borda do mapa vira parede (os quadrados piscam antes). Quem estiver nela é esmagado.'],
      ['🏆', '3. Seja o último', 'O último jogador vivo vence. Corra para o centro antes que a zona feche!'],
    ],
    jogadores: JOGADORES_OURO,
    ehBot: JOGADORES_OURO.map(c => c.controle === 'bot'),
    controlesHTML: '<span style="color:#7db4ff">JOGADOR 1 &nbsp;<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span>' +
                   '<span style="color:#ff8f8f">JOGADOR 2 &nbsp;<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> &nbsp;<small style="font-weight:600;color:#aeb6cc">(tecla 2 liga/desliga)</small></span>',
    preparar: sobPreparar,
    atualizar: sobAtualizar,
    decidirBot: decidirBotSob,
    aoMover() {},
    aoEliminar: sobAoEliminar,
    musicaRapida: () => sobVivos().length <= 3,
    desenharChao: T => sobDesenharChao(T),
    desenharAvisos: T => sobDesenharAvisos(T),
    desenharHUD: () => hudSob(),
  },
  band: {
    nome: 'Bandeira',
    tempoRenascer: TEMPO_RENASCER_BAND,
    ritmo: RITMO_OURO,
    lentidaoDourado: LENTIDAO_BANDEIRA,
    passos: [
      ['🚩', '1. Roube a bandeira', 'Pise na bandeira do time inimigo, dentro da base dele, para pegá-la.'],
      ['🏠', '2. Traga para casa', 'Leve até o quadrado da sua bandeira para marcar 1 captura. Quem carrega anda mais devagar.'],
      ['🛡️', '3. Proteja a sua', 'Elimine quem estiver com a bandeira: ela cai, e o time dono pisa nela para devolvê-la.'],
    ],
    jogadores: JOGADORES_TIMES,
    ehBot: JOGADORES_TIMES.map(c => c.controle === 'bot'),
    controlesHTML: '<span style="color:#7db4ff">AZUL &nbsp;<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span>' +
                   '<span style="color:#ff8f8f">VERMELHO &nbsp;<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></span>',
    preparar: bandPreparar,
    atualizar: bandAtualizar,
    decidirBot: decidirBotBand,
    aoMover: bandAoMover,
    aoEliminar: bandAoEliminar,
    musicaRapida: () => Object.values(estado.bandeiras).some(f => f.dono),
    desenharChao: T => bandDesenharChao(T),
    desenharAvisos() {},
    desenharHUD: () => hudBand(),
  },
  rev: {
    nome: 'Revezamento',
    tempoRenascer: TEMPO_RENASCER_REV,
    ritmo: RITMO_OURO,
    passos: [
      ['🔄', '1. Um objetivo por vez', 'Uma zona 3x3 acende em um lugar aleatório do mapa. O novo lugar pisca antes, então corra para lá!'],
      ['⏱️', '2. Domine a zona', 'Fique nela sem nenhum adversário dentro para encher a barra. Mais jogadores do time = mais rápido.'],
      ['🏆', '3. Faça 5 pontos', 'Cada objetivo capturado vale 1 ponto. Pise nos rivais para expulsá-los da zona!'],
    ],
    jogadores: JOGADORES_TIMES,
    ehBot: JOGADORES_TIMES.map(c => c.controle === 'bot'),
    controlesHTML: '<span style="color:#7db4ff">AZUL &nbsp;<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span>' +
                   '<span style="color:#ff8f8f">VERMELHO &nbsp;<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></span>',
    preparar: revPreparar,
    atualizar: revAtualizar,
    decidirBot: decidirBotRev,
    aoMover() {},
    aoEliminar() {},
    musicaRapida: () => Math.max(estado.rev.pontos.azul, estado.rev.pontos.vermelho) >= PONTOS_PARA_VENCER_REV - 1,
    desenharChao: T => revDesenharChao(T),
    desenharAvisos() {},
    desenharHUD: () => hudRev(),
  },
};


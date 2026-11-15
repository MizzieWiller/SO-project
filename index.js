const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   Senha opcional (defina PAINEL_SENHA nas variáveis de ambiente da hospedagem)
   Usuário: qualquer um · Senha: o valor de PAINEL_SENHA
========================= */
const SENHA = process.env.PAINEL_SENHA;
if (SENHA) {
  app.use((req, res, next) => {
    const h = req.headers.authorization || "";
    const dec = Buffer.from(h.split(" ")[1] || "", "base64").toString();
    if (dec.slice(dec.indexOf(":") + 1) === SENHA) return next();
    res.set("WWW-Authenticate", 'Basic realm="painel"').status(401).send("senha necessária");
  });
}

/* =========================
   Registos e contadores
========================= */
let totalRequests = 0;
const logsArray = [];
const ramHistory = [];

const originalLog = console.log;
console.log = function (...args) {
  const time = new Date().toLocaleTimeString("pt-PT");
  logsArray.unshift(`[${time}] ${args.join(" ")}`);
  if (logsArray.length > 15) logsArray.pop();
  originalLog.apply(console, args);
};

// conta só as visitas à página (não as atualizações automáticas)
app.use((req, res, next) => { if (req.path === "/") totalRequests++; next(); });

const calcPercent = (p, t) => (t ? ((p / t) * 100).toFixed(0) : "0");

setInterval(() => {
  ramHistory.push({
    time: new Date().toLocaleTimeString("pt-PT"),
    value: Number(calcPercent(os.totalmem() - os.freemem(), os.totalmem())),
  });
  if (ramHistory.length > 25) ramHistory.shift();
}, 10000);

/* =========================
   Músicas (coloca ficheiros mp3/ogg/wav/m4a na pasta "musicas")
========================= */
const MUSIC_DIR = path.join(__dirname, "musicas");
try { fs.mkdirSync(MUSIC_DIR, { recursive: true }); } catch (e) {}
app.use("/musicas", express.static(MUSIC_DIR));

function listTracks() {
  try {
    return fs.readdirSync(MUSIC_DIR)
      .filter((f) => /\.(mp3|ogg|wav|m4a|webm)$/i.test(f))
      .sort()
      .map((f) => ({ name: f.replace(/\.[^.]+$/, ""), url: "/musicas/" + encodeURIComponent(f) }));
  } catch (e) { return []; }
}

/* =========================
   Dados do sistema
========================= */
const runGit = (args) =>
  execFileSync("git", args, { windowsHide: true, stdio: ["ignore", "pipe", "ignore"], timeout: 3000 }).toString().trim();

let gitCache = { hash: "N/A", branch: "N/A", msg: "sem dados" }, gitAt = 0;
function getGit() {
  if (Date.now() - gitAt < 60000) return gitCache;
  gitAt = Date.now();
  try {
    gitCache = {
      hash: runGit(["rev-parse", "--short", "HEAD"]),
      branch: runGit(["rev-parse", "--abbrev-ref", "HEAD"]),
      msg: runGit(["log", "-1", "--pretty=%B"]),
    };
  } catch (e) {}
  return gitCache;
}

function getDisk() {
  try {
    const s = fs.statfsSync(path.parse(process.cwd()).root);
    const size = s.blocks * s.bsize, avail = s.bavail * s.bsize, used = size - s.bfree * s.bsize;
    const g = (v) => (v / 1024 / 1024 / 1024).toFixed(0) + "G";
    return { size: g(size), used: g(used), avail: g(avail), percent: Math.round((used / size) * 100) + "%" };
  } catch (e) {
    return { size: "N/A", used: "N/A", avail: "N/A", percent: "0%" };
  }
}

function getSystemData() {
  const cpus = os.cpus();
  const avgCpu = Number((
    cpus.reduce((s, c) => {
      const busy = c.times.user + c.times.nice + c.times.sys + c.times.irq;
      return s + Number(calcPercent(busy, busy + c.times.idle));
    }, 0) / cpus.length
  ).toFixed(0));

  const ips = Object.values(os.networkInterfaces()).flat().filter((i) => !i.internal && i.family === "IPv4");
  const ramUsage = Number(calcPercent(os.totalmem() - os.freemem(), os.totalmem()));
  const status =
    ramUsage > 85 ? { text: "crítico", msg: "a memória está quase cheia. reinicia ou liberta recursos." }
    : ramUsage > 65 ? { text: "sobrecarga", msg: "a memória está a subir. vale a pena vigiar." }
    : { text: "estável", msg: "tudo a funcionar sem problemas." };

  let files = [];
  try { files = fs.readdirSync(".").slice(0, 7); } catch (e) {}

  if (ramHistory.length === 0) ramHistory.push({ time: new Date().toLocaleTimeString("pt-PT"), value: ramUsage });

  return {
    hostname: os.hostname(),
    ip: ips.length ? ips[0].address : "N/A",
    node: process.version,
    arch: os.arch(),
    sistema: os.type() + " " + os.release(),
    porta: String(PORT),
    cpuCount: cpus.length,
    cpuModel: cpus[0] ? cpus[0].model.trim() : "N/A",
    avgCpu,
    ramUsage,
    ramTotal: os.totalmem(),
    ramFree: os.freemem(),
    rss: process.memoryUsage().rss,
    disk: getDisk(),
    git: getGit(),
    files,
    uptime: process.uptime(),
    requests: totalRequests,
    status,
    ramHistory,
    logs: logsArray,
  };
}

/* =========================
   Rotas
========================= */
app.get("/api/dados", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getSystemData());
});

app.get("/api/musicas", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(listTracks());
});

// a página (HTML, CSS e JS do navegador) fica em public/index.html
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => console.log("painel pronto na porta " + PORT));

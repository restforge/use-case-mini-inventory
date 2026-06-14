#!/usr/bin/env node
/**
 * fast-track.mjs — Pembangun use-case Mini Inventory otomatis (interaksi minimal).
 *
 * Cara menjalankan (dari root use-case 04-mini-inventory):
 *
 *     node fast-track.mjs
 *
 * Berbeda dengan menjalankan file bat satu per satu (schema-init, seed-init,
 * server-create, dashboard-create, create-all, ...), fast-track hanya meminta
 * SATU set input di awal (license + database), lalu menjalankan SELURUH pipeline
 * Mini Inventory otomatis: setup database (schema + seed via native client),
 * generate 7 endpoint + 2 dashboard backend, generate frontend multi-page,
 * membuka backend + frontend di window CMD, dan diakhiri konfirmasi membuka browser.
 *
 * Mini Inventory KHUSUS untuk database server: postgresql, mysql, oracle.
 * Tidak ada jalur sqlite. Setiap platform memakai SQL schema/seed mentah yang
 * dijalankan lewat native client (psql / mysql / sqlplus), sehingga client
 * yang sesuai harus tersedia di PATH.
 *
 * Catatan: source ini sengaja ditulis terbuka (tidak di-obfuscate).
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readSync, writeFileSync, mkdirSync } from 'node:fs';

// =============================================================================
// PATH & KONFIGURASI DASAR
// =============================================================================

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const BASE = existsSync(join(SCRIPT_DIR, 'backend')) ? SCRIPT_DIR : process.cwd();

const BACKEND = 'backend';
const FRONTEND = 'frontend';
const FRONTEND_APP = 'frontend/mini-inventory';
const DATABASE = 'database';

const resolveCwd = (cwd) => (cwd ? join(BASE, cwd) : BASE);

// Map DB_TYPE (restforge) -> nama folder platform di database/.
const PLATFORM_DIR = { postgresql: 'postgres', mysql: 'mysql', oracle: 'oracle' };

// Tipe database yang didukung Mini Inventory (sqlite TIDAK didukung).
const SUPPORTED_DB_TYPES = ['postgresql', 'mysql', 'oracle'];

// Default koneksi per tipe database. Enter saat input = pakai default.
const DB_DEFAULTS = {
  postgresql: { DB_HOST: '127.0.0.1', DB_PORT: '5432', DB_USER: 'postgres', DB_PASSWORD: 'postgres1234', DB_NAME: 'dbinv' },
  mysql:      { DB_HOST: '127.0.0.1', DB_PORT: '3306', DB_USER: 'root',     DB_PASSWORD: 'mysql1234',    DB_NAME: 'dbinv' },
  oracle:     { DB_HOST: '127.0.0.1', DB_PORT: '1521', DB_USER: 'dbinv',    DB_PASSWORD: 'dbinv',        DB_SERVICE_NAME: 'ORCL' },
};

const DEFAULT_LICENSE = '8ECD-92A4-86BB-698Q';

// Bin path umum tiap native client (di-append ke PATH saat menjalankan client).
const CLIENT_PATHS = {
  postgresql: ['C:\\Program Files\\PostgreSQL\\16\\bin', 'C:\\Program Files\\PostgreSQL\\15\\bin', 'C:\\Program Files\\PostgreSQL\\14\\bin', 'C:\\PostgreSQL\\12\\bin'],
  mysql:      ['C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin', 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin', 'C:\\xampp\\mysql\\bin'],
  oracle:     ['C:\\oracle\\product\\19.0.0\\client_1\\bin', 'C:\\oracle\\instantclient_19_8'],
};

// Frontend / Designer (lihat frontend/generate.bat & create-all.bat).
const FRONTEND_OUTPUT = './mini-inventory';
const FRONTEND_PAYLOAD = 'payload/all-pages.json';

const SERVER_PORT = '3032';
const FRONTEND_PORT = '8000';
const BROWSER_URL = `http://localhost:${FRONTEND_PORT}/index.html`;

// Daftar endpoint backend (lihat backend/server-create.bat).
const ENDPOINTS = ['category', 'warehouse', 'supplier', 'customer', 'item-product', 'stock-inbound', 'stock-outbound'];

// Daftar dashboard backend (lihat backend/dashboard-create.bat).
const DASHBOARDS = [
  { name: 'dash-inbound', payload: 'dashboard-inbound.json' },
  { name: 'dash-outbound', payload: 'dashboard-outbound.json' },
];

const DOUBLE = '='.repeat(64);

// =============================================================================
// TEMPLATE db-connection.env (selalu ditulis ulang fresh dari input)
// =============================================================================
//
// Bagian non-database (server, redis, export, kafka, logging, dst.) adalah
// config project yang tetap. Hanya LICENSE dan blok Database Configuration
// yang diisi dari input pengguna. File ditulis ulang setiap run agar selalu
// fresh dan tidak bergantung pada keberadaan file lama.

const ENV_HEAD = (license) => `# License
LICENSE=${license}

# Server
SERVER_ADDRESS=127.0.0.1
SERVER_PORT=${SERVER_PORT}
LIVE_SYNC_ENABLED=false
LIVE_SYNC_PORT=4032

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=redis1234
REDIS_DB=0

# Export Configuration
EXPORT_FILE_EXPIRY=3600000
EXPORT_CHUNK_SIZE=1000

# Kafka Configuration
KAFKA_ENABLED=false
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=25000
KAFKA_TOPIC_PATTERN={module}.{endpoint}.events
KAFKA_TENANT_ID=default
KAFKA_SESSION_TIMEOUT=30000
KAFKA_HEARTBEAT_INTERVAL=3000
KAFKA_MAX_BYTES_PER_PARTITION=1048576
KAFKA_AUTO_COMMIT=false
KAFKA_AUTO_COMMIT_INTERVAL=5000
KAFKA_RETRY_ATTEMPTS=3
KAFKA_RETRY_DELAY=1000
KAFKA_RETRY_MAX_DELAY=30000
KAFKA_SSL=false
KAFKA_LOG_LEVEL=info
`;

const ENV_TAIL = `
# Logging Configuration
LOG_LEVEL=debug
LOG_TO_FILE=true

# SQL Logging
SQL_LOG_ENABLED=false
SQL_LOG_LEVEL=debug
SQL_LOG_PARAMS=false
SQL_LOG_SLOW_THRESHOLD=1000

# Cache Configuration
CACHE_ENABLED=false
CACHE_TTL=300

# Job Scheduler
JOB_ENABLED=false
JOB_CONCURRENCY=5
JOB_RETENTION_HOURS=72
JOB_FAILED_RETENTION_HOURS=168
JOB_SHUTDOWN_TIMEOUT=10000
JOB_STALLED_INTERVAL=30000
JOB_MAX_STALLED_COUNT=2

# Distributed Lock Configuration
LOCK_DISTRIBUTED_ENABLED=false
LOCK_DISTRIBUTED_TTL=10
LOCK_RESOURCE_MAX_TTL=600
LOCK_DISTRIBUTED_RETRY=3
LOCK_DISTRIBUTED_RETRY_DELAY=100
LOCK_DISTRIBUTED_STRATEGY=reject

# ID Generator Configuration
IDGEN_ENABLED=false
IDGEN_IDEM_TTL=600
IDGEN_COUNTER_TTL_MONTHLY=2764800
IDGEN_COUNTER_TTL_DAILY=172800
IDGEN_DEFAULT_MAX_RETRY=10
IDGEN_DEFAULT_PIN_DIGITS=6
IDGEN_DEFAULT_SERIAL_PATTERN=XXXX-XXXX-XXXX-XXXX
IDGEN_DEFAULT_CODE_PATTERN=9999-9999
IDGEN_ALLOW_RESET=true
`;

/** Bangun blok "# Database Configuration" sesuai tipe database dari input. */
function renderDbBlock(cfg) {
  const lines = [
    '# Database Configuration',
    `DB_TYPE=${cfg.DB_TYPE}`,
    `DB_HOST=${cfg.DB_HOST}`,
    `DB_PORT=${cfg.DB_PORT}`,
    `DB_USER=${cfg.DB_USER}`,
    `DB_PASSWORD=${cfg.DB_PASSWORD}`,
  ];
  if (cfg.DB_TYPE === 'oracle') {
    // Generator/validate butuh DB_SERVICE_NAME; runtime oracle membaca DB_NAME.
    lines.push(`DB_SERVICE_NAME=${cfg.DB_SERVICE_NAME}`);
    lines.push(`DB_NAME=${cfg.DB_SERVICE_NAME}`);
  } else {
    lines.push(`DB_NAME=${cfg.DB_NAME}`);
  }
  return lines.join('\n') + '\n';
}

/** Tulis ulang config/db-connection.env fresh dari template + input. */
function writeEnvFile(cfg) {
  const filePath = join(resolveCwd(BACKEND), 'config', 'db-connection.env');
  mkdirSync(dirname(filePath), { recursive: true });
  const content = ENV_HEAD(cfg.LICENSE) + '\n' + renderDbBlock(cfg) + ENV_TAIL;
  writeFileSync(filePath, content);
  console.log('  + tulis fresh config/db-connection.env (license + database dari input).');
}

// =============================================================================
// I/O HELPER
// =============================================================================

/** Baca satu baris dari stdin secara sinkron (per-byte), aman saat di-pipe. */
function ask(prompt) {
  process.stdout.write(prompt);
  const buf = Buffer.alloc(1);
  let line = '';
  for (;;) {
    let bytes;
    try {
      bytes = readSync(0, buf, 0, 1, null);
    } catch (e) {
      if (e.code === 'EAGAIN') {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
        continue;
      }
      if (e.code === 'EOF') break;
      throw e;
    }
    if (bytes === 0) break;
    const ch = buf.toString('utf8');
    if (ch === '\n') break;
    if (ch === '\r') continue;
    line += ch;
  }
  return line.trim();
}

/** Tanya satu field dengan default dalam kurung; Enter = pakai default. */
function askField(label, def) {
  const inp = ask(`  ${label} (${def}): `);
  return inp || def;
}

function fail(msg) {
  console.log(`\n  [GAGAL] ${msg}`);
  console.log('  Fast-track dihentikan. Perbaiki masalah di atas lalu jalankan ulang.');
  process.exit(1);
}

function phase(title) {
  console.log('');
  console.log(DOUBLE);
  console.log(`  ${title}`);
  console.log(DOUBLE);
}

// =============================================================================
// EXEC HELPER
// =============================================================================

/** Jalankan perintah CMD inline; stop pipeline bila gagal (kecuali allowNonZero). */
function run(label, cmd, cwd, { allowNonZero = false, env } = {}) {
  console.log(`\n  > ${cmd}`);
  // Bungkus seluruh command dalam kutip + windowsVerbatimArguments agar Node
  // TIDAK meng-escape ulang tanda kutip di dalam `cmd`. Tanpa ini, nested quote
  // (mis. -c "CREATE DATABASE \"db\";" atau -f "path berisi spasi") rusak karena
  // Node mengubah `"` jadi `\"` dan cmd.exe tidak meng-unescape-nya, sehingga
  // kutip literal tembus ke psql. Flag /s membuang kutip terluar lalu menjalankan
  // sisanya apa adanya (pola yang sama dipakai Node untuk shell: true).
  const r = spawnSync('cmd', ['/d', '/s', '/c', `"${cmd}"`], {
    cwd: resolveCwd(cwd),
    stdio: 'inherit',
    windowsVerbatimArguments: true,
    env: env ? { ...process.env, ...env } : process.env,
  });
  if (r.error) fail(`${label}: ${r.error.message}`);
  if (!allowNonZero && r.status !== 0) fail(`${label} (kode keluar ${r.status}).`);
  return r.status;
}

/** Cek native client tersedia (mis. "psql --version"); fail bila tidak ada. */
function ensureClient(label, versionCmd, pathEnv) {
  const r = spawnSync('cmd', ['/S', '/C', versionCmd], {
    stdio: 'ignore',
    env: { ...process.env, PATH: pathEnv },
  });
  if (r.error || r.status !== 0) {
    fail(`${label} tidak ditemukan di PATH. Install client database lalu jalankan ulang.`);
  }
}

/** Bangun PATH dengan menambahkan bin client umum untuk tipe database. */
function clientPath(dbType) {
  const extra = (CLIENT_PATHS[dbType] || []).filter((p) => existsSync(p));
  return [process.env.PATH, ...extra].join(';');
}

/** Bila port dipakai, hentikan proses lama otomatis (fast-track = non-interaktif). */
function freePort(port) {
  const res = spawnSync('cmd', ['/S', '/C', `netstat -ano | findstr :${port}`], { encoding: 'utf8' });
  const pids = new Set();
  for (const line of (res.stdout || '').split(/\r?\n/)) {
    const p = line.trim().split(/\s+/);
    if (p.length >= 5 && /LISTENING/i.test(p[3]) && p[1].endsWith(`:${port}`)) {
      if (/^\d+$/.test(p[4]) && p[4] !== '0') pids.add(p[4]);
    }
  }
  if (pids.size === 0) return;
  console.log(`  Port ${port} dipakai (PID ${[...pids].join(', ')}); menghentikan proses lama...`);
  for (const pid of pids) spawnSync('cmd', ['/S', '/C', `taskkill /PID ${pid} /F`], { stdio: 'inherit' });
}

/** Buka service (foreground) di window CMD baru, tidak memblokir fast-track. */
function startService(cmd, cwd, title) {
  console.log(`\n  Membuka window CMD baru: "${title}"`);
  console.log(`  > ${cmd}`);
  const r = spawnSync('cmd', ['/C', 'start', title, 'cmd', '/k', cmd], { cwd: resolveCwd(cwd), stdio: 'inherit' });
  if (r.error) console.log(`  Gagal membuka window service: ${r.error.message}`);
  else console.log('  ✓ Window service dibuka.');
}

function openBrowser(url) {
  spawnSync('cmd', ['/c', 'start', '', url], { stdio: 'inherit' });
}

// =============================================================================
// DATABASE: SCHEMA + SEED VIA NATIVE CLIENT (per platform)
// =============================================================================

function setupDatabase(cfg) {
  const platDir = PLATFORM_DIR[cfg.DB_TYPE];
  const schemaFile = join(resolveCwd(DATABASE), 'schemas', platDir, 'mini-inventory.sql');
  const seedFile = join(resolveCwd(DATABASE), 'seeds', platDir, 'mini-inventory-seed.sql');
  if (!existsSync(schemaFile)) fail(`File schema tidak ditemukan: ${schemaFile}`);
  if (!existsSync(seedFile)) fail(`File seed tidak ditemukan: ${seedFile}`);

  const PATH_WITH_CLIENT = clientPath(cfg.DB_TYPE);

  if (cfg.DB_TYPE === 'postgresql') {
    ensureClient('PostgreSQL client (psql)', 'psql --version', PATH_WITH_CLIENT);
    const env = { PATH: PATH_WITH_CLIENT, PGPASSWORD: cfg.DB_PASSWORD };
    const base = `psql -h ${cfg.DB_HOST} -p ${cfg.DB_PORT} -U ${cfg.DB_USER}`;
    // Create database bila belum ada (abaikan error "already exists").
    run('create database', `${base} -d postgres -c "CREATE DATABASE \\"${cfg.DB_NAME}\\";"`, BACKEND, { allowNonZero: true, env });
    run('schema', `${base} -d ${cfg.DB_NAME} -v ON_ERROR_STOP=1 -f "${schemaFile}"`, BACKEND, { env });
    run('seed', `${base} -d ${cfg.DB_NAME} -v ON_ERROR_STOP=1 -f "${seedFile}"`, BACKEND, { env });
  } else if (cfg.DB_TYPE === 'mysql') {
    ensureClient('MySQL client (mysql)', 'mysql --version', PATH_WITH_CLIENT);
    const env = { PATH: PATH_WITH_CLIENT };
    const base = `mysql -h ${cfg.DB_HOST} -P ${cfg.DB_PORT} -u ${cfg.DB_USER} -p${cfg.DB_PASSWORD}`;
    run('create database', `${base} -e "CREATE DATABASE IF NOT EXISTS ${cfg.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`, BACKEND, { env });
    run('schema', `${base} ${cfg.DB_NAME} < "${schemaFile}"`, BACKEND, { env });
    run('seed', `${base} ${cfg.DB_NAME} < "${seedFile}"`, BACKEND, { env });
  } else if (cfg.DB_TYPE === 'oracle') {
    // Oracle: user adalah schema; database/user diasumsikan sudah ada
    // (sqlplus tidak membuat user tanpa privilege DBA). Schema SQL menjalankan
    // drop & create tabel di dalam schema user tersebut.
    ensureClient('Oracle client (sqlplus)', 'sqlplus -V', PATH_WITH_CLIENT);
    const env = { PATH: PATH_WITH_CLIENT };
    const conn = `${cfg.DB_USER}/${cfg.DB_PASSWORD}@${cfg.DB_HOST}:${cfg.DB_PORT}/${cfg.DB_SERVICE_NAME}`;
    run('schema', `sqlplus -S -L ${conn} @"${schemaFile}"`, BACKEND, { env });
    run('seed', `sqlplus -S -L ${conn} @"${seedFile}"`, BACKEND, { env });
  } else {
    fail(`Tipe database tidak didukung: ${cfg.DB_TYPE}`);
  }
}

// =============================================================================
// PIPELINE
// =============================================================================

function buildUseCase(cfg) {
  const license = cfg.LICENSE;

  phase('1/6  Persiapan environment backend');
  if (existsSync(join(resolveCwd(BACKEND), 'node_modules', '@restforgejs', 'platform'))) {
    console.log('  node_modules/@restforgejs/platform sudah ada; lewati npm install.');
  } else {
    run('npm install', 'npm install @restforgejs/platform', BACKEND);
  }
  // Tulis ulang config/db-connection.env fresh dari template + input
  // (license + auth database). Tidak bergantung pada file lama.
  writeEnvFile(cfg);

  phase('2/6  Setup database (schema + seed)');
  setupDatabase(cfg);

  phase('3/6  Validasi koneksi');
  run('validate', 'npx restforge validate --config=db-connection.env', BACKEND);

  phase('4/6  Backend: endpoint + dashboard');
  for (const ep of ENDPOINTS) {
    run(`endpoint ${ep}`, `npx restforge endpoint create --project=mini-inventory --name=${ep} --payload=${ep}.json --force=true --config=db-connection.env`, BACKEND);
  }
  for (const db of DASHBOARDS) {
    run(`dashboard ${db.name}`, `npx restforge dashboard create --project=mini-inventory --name=${db.name} --payload=${db.payload} --force=true`, BACKEND);
  }

  phase('5/6  Frontend (Designer generate, scope app)');
  run('designer activate', `restforge-designer activate --key=${license}`, FRONTEND, { allowNonZero: true });
  run('designer generate', `restforge-designer generate --payload=${FRONTEND_PAYLOAD} --output=${FRONTEND_OUTPUT} --scope app --overwrite`, FRONTEND);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  spawnSync('cmd', ['/c', 'cls'], { stdio: 'inherit' });
  console.log(DOUBLE);
  console.log('  Mini Inventory — Fast Track');
  console.log(DOUBLE);
  console.log();
  console.log('  Membangun use-case lengkap (database + 7 endpoint + 2 dashboard');
  console.log('  backend, lalu frontend multi-page) secara otomatis.');
  console.log();
  console.log('  Database didukung : postgresql, mysql, oracle (tanpa sqlite).');
  console.log(`  Root use-case     : ${BASE}`);
  console.log();

  if (!existsSync(join(BASE, 'backend')) || !existsSync(join(BASE, 'database'))) {
    console.log("  [PERINGATAN] Folder 'backend' / 'database' tidak ditemukan di root ini.");
    console.log('  Pastikan fast-track.mjs dijalankan dari root use-case 04-mini-inventory.');
    console.log();
  }

  console.log('  Masukkan konfigurasi (Enter untuk memakai nilai default):');
  console.log();
  const cfg = {};
  cfg.LICENSE = askField('LICENSE', DEFAULT_LICENSE);
  cfg.DB_TYPE = askField('DB_TYPE (postgresql/mysql/oracle)', 'postgresql').toLowerCase();

  if (!SUPPORTED_DB_TYPES.includes(cfg.DB_TYPE)) {
    fail(`DB_TYPE '${cfg.DB_TYPE}' tidak didukung. Mini Inventory hanya untuk: ${SUPPORTED_DB_TYPES.join(', ')}.`);
  }

  const d = DB_DEFAULTS[cfg.DB_TYPE];
  cfg.DB_HOST = askField('DB_HOST', d.DB_HOST);
  cfg.DB_PORT = askField('DB_PORT', d.DB_PORT);
  cfg.DB_USER = askField('DB_USER', d.DB_USER);
  cfg.DB_PASSWORD = askField('DB_PASSWORD', d.DB_PASSWORD);
  if (cfg.DB_TYPE === 'oracle') {
    cfg.DB_SERVICE_NAME = askField('DB_SERVICE_NAME', d.DB_SERVICE_NAME);
  } else {
    cfg.DB_NAME = askField('DB_NAME', d.DB_NAME);
  }

  console.log();
  const go = ask('  Bangun use-case sekarang? (Y/n): ').toLowerCase();
  if (go === 'n' || go === 'no' || go === 'tidak') {
    console.log('\n  Dibatalkan. Sampai jumpa.');
    return;
  }

  buildUseCase(cfg);

  phase('6/6  Menjalankan service');
  freePort(SERVER_PORT);
  startService('npx restforge serve --project=mini-inventory --config=db-connection.env --watch', BACKEND, 'RESTForge Server - mini-inventory');
  freePort(FRONTEND_PORT);
  startService('app-start.bat', FRONTEND_APP, 'RESTForge Frontend - mini-inventory');

  console.log('');
  console.log(DOUBLE);
  console.log('  MINI INVENTORY SIAP');
  console.log(DOUBLE);
  console.log();
  console.log(`  Backend  : window "RESTForge Server - mini-inventory" (port ${SERVER_PORT})`);
  console.log(`  Frontend : window "RESTForge Frontend - mini-inventory" (port ${FRONTEND_PORT})`);
  console.log();
  const open = ask(`  Buka browser ${BROWSER_URL} sekarang? (Y/n): `).toLowerCase();
  if (open === 'n' || open === 'no' || open === 'tidak') {
    console.log(`\n  Lewati. Buka manual: ${BROWSER_URL}`);
  } else {
    openBrowser(BROWSER_URL);
    console.log(`\n  ✓ Browser dibuka: ${BROWSER_URL}`);
  }
  console.log();
  console.log('  Login menggunakan kredensial berikut:');
  console.log('    User     : admin.inv');
  console.log('    Password : Admin@1234');
  console.log();
}

main();

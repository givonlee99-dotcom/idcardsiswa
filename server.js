const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_DIR = path.join(__dirname, "db");
const LOCK_FILE = path.join(DB_DIR, "idcard-lock.json");
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 jam

app.use(cors());
app.use(express.json());

// frontend
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// pastikan db ada
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(LOCK_FILE)) {
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ devices: {} }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(LOCK_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(LOCK_FILE, JSON.stringify(data, null, 2));
}

function ensureDevice(db, deviceId) {
  const now = new Date().toISOString();

  if (!db.devices[deviceId]) {
    db.devices[deviceId] = {
      uses: 0,
      blockedUntil: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  return db.devices[deviceId];
}

function isCooldownActive(device) {
  if (!device.blockedUntil) return false;
  return new Date(device.blockedUntil).getTime() > Date.now();
}

function resetIfExpired(device) {
  if (!device.blockedUntil) return false;

  const blockedUntilTime = new Date(device.blockedUntil).getTime();
  if (Date.now() >= blockedUntilTime) {
    device.uses = 0;
    device.blockedUntil = null;
    return true;
  }

  return false;
}

app.get("/api/lock", (req, res) => {
  const deviceId = String(req.query.deviceId || "").trim();

  if (!deviceId) {
    return res.status(400).json({
      allowed: false,
      message: "deviceId tidak ditemukan.",
    });
  }

  const db = readDB();
  const device = ensureDevice(db, deviceId);
  const now = new Date().toISOString();

  resetIfExpired(device);

  if (isCooldownActive(device)) {
    device.updatedAt = now;
    writeDB(db);

    return res.status(403).json({
      allowed: false,
      message: "Perangkat ini sedang cooldown 24 jam. Hubungi admin jika perlu reset.",
      blockedUntil: device.blockedUntil,
    });
  }

  device.updatedAt = now;
  writeDB(db);

  return res.json({
    allowed: true,
    message: "Akses perangkat valid.",
    uses: device.uses,
    blockedUntil: device.blockedUntil,
  });
});

app.post("/api/lock/use", (req, res) => {
  const deviceId = String(req.body?.deviceId || "").trim();

  if (!deviceId) {
    return res.status(400).json({
      ok: false,
      message: "deviceId tidak ditemukan.",
    });
  }

  const db = readDB();
  const device = ensureDevice(db, deviceId);
  const now = new Date();

  resetIfExpired(device);

  if (isCooldownActive(device)) {
    device.updatedAt = now.toISOString();
    writeDB(db);

    return res.status(403).json({
      ok: false,
      message: "Perangkat ini sedang cooldown 24 jam. Hubungi admin untuk reset.",
      blockedUntil: device.blockedUntil,
    });
  }

  device.uses += 1;
  device.updatedAt = now.toISOString();

  if (device.uses >= 2) {
    const blockedUntil = new Date(now.getTime() + COOLDOWN_MS).toISOString();
    device.blockedUntil = blockedUntil;
    device.uses = 0; // reset supaya setelah 24 jam bisa pakai lagi dari awal
    writeDB(db);

    return res.json({
      ok: true,
      cooldown: true,
      message: "Batas 2 kali tercapai. Akses dikunci 24 jam.",
      blockedUntil,
    });
  }

  writeDB(db);

  return res.json({
    ok: true,
    cooldown: false,
    uses: device.uses,
    message: "Pemakaian berhasil dicatat.",
  });
});

// root buka halaman form
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

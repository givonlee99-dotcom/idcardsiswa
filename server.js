const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_DIR = path.join(__dirname, "db");
const LOCK_FILE = path.join(DB_DIR, "idcard-lock.json");

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

// cek akses device
app.get("/api/lock", (req, res) => {
  const deviceId = String(req.query.deviceId || "").trim();

  if (!deviceId) {
    return res.status(400).json({
      allowed: false,
      message: "deviceId tidak ditemukan.",
    });
  }

  const db = readDB();
  const now = new Date().toISOString();

  if (!db.devices[deviceId]) {
    db.devices[deviceId] = {
      uses: 0,
      createdAt: now,
      updatedAt: now,
    };
    writeDB(db);
  }

  const device = db.devices[deviceId];

  if (device.uses >= 2) {
    device.updatedAt = now;
    writeDB(db);

    return res.status(403).json({
      allowed: false,
      message: "Perangkat ini sudah mencapai batas 2 kali. Hubungi admin.",
    });
  }

  device.updatedAt = now;
  writeDB(db);

  return res.json({
    allowed: true,
    message: "Akses perangkat valid.",
    uses: device.uses,
  });
});

// catat 1 kali download selesai
app.post("/api/lock/use", (req, res) => {
  const deviceId = String(req.body?.deviceId || "").trim();

  if (!deviceId) {
    return res.status(400).json({
      ok: false,
      message: "deviceId tidak ditemukan.",
    });
  }

  const db = readDB();
  const now = new Date().toISOString();

  if (!db.devices[deviceId]) {
    db.devices[deviceId] = {
      uses: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  const device = db.devices[deviceId];

  if (device.uses >= 2) {
    device.updatedAt = now;
    writeDB(db);

    return res.status(403).json({
      ok: false,
      message: "Perangkat ini sudah mencapai batas 2 kali. Hubungi admin.",
    });
  }

  device.uses += 1;
  device.updatedAt = now;
  writeDB(db);

  return res.json({
    ok: true,
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

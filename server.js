import express from "express";
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT,
};

const db = admin.database();
const app = express();
app.use(express.json());

// Util: formatea YYYY-MM-DD
function formatDateYYYYMMDD(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------------------------------------------------------
   POST /gps
   Ahora también recibe acelerómetro: ax, ay, az
--------------------------------------------------------- */
app.post("/gps", async (req, res) => {
  try {
    const { lat, lng, ax, ay, az, deviceId } = req.body;

    if (typeof lat !== "number" && typeof lat !== "string") {
      return res.status(400).json({ error: "Faltan datos GPS: lat" });
    }
    if (typeof lng !== "number" && typeof lng !== "string") {
      return res.status(400).json({ error: "Faltan datos GPS: lng" });
    }

    const timestamp = Date.now();
    const id = deviceId ? String(deviceId) : "vehiculo1";

    const point = {
      lat: Number(lat),
      lng: Number(lng),
      ax: ax !== undefined ? Number(ax) : null,
      ay: ay !== undefined ? Number(ay) : null,
      az: az !== undefined ? Number(az) : null,
      timestamp,
      deviceId: id,
    };

    // Posición actual
    await db.ref(id).set(point);

    // Historial
    const date = formatDateYYYYMMDD(timestamp);
    await db.ref(`historial/${id}/${date}/${timestamp}`).set(point);

    return res.json({ status: "OK", saved: point });
  } catch (err) {
    console.error("Error en /gps:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

/* ---------------------------------------------------------
   ENDPOINT OPCIONAL
   /accel → guardar acelerómetro por separado si lo necesitás
--------------------------------------------------------- */
app.post("/accel", async (req, res) => {
  try {
    const { ax, ay, az, deviceId } = req.body;

    const id = deviceId ? String(deviceId) : "vehiculo1";
    const timestamp = Date.now();

    const accel = {
      ax: Number(ax),
      ay: Number(ay),
      az: Number(az),
      timestamp,
      deviceId: id,
    };

    const date = formatDateYYYYMMDD(timestamp);

    await db.ref(`acelerometro/${id}/${date}/${timestamp}`).set(accel);

    res.json({ status: "OK", saved: accel });
  } catch (err) {
    console.error("Error en /accel:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

app.get("/", (req, res) => res.send("Backend GPS con historial + acelerómetro activo"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server en puerto ${PORT}`));
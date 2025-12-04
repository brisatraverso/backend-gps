import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

// --- Inicialización de Firebase Admin (ya deberías tener el service key en el servidor) ---
const serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-key.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rastreo-gps-f15f7-default-rtdb.firebaseio.com/" // <- reemplazá por tu URL
});

const db = admin.database();

const app = express();
app.use(cors());
app.use(express.json());

// Util: formatea YYYY-MM-DD
function formatDateYYYYMMDD(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

app.post('/gps', async (req, res) => {
  try {
    const { lat, lng, deviceId } = req.body;

    if (typeof lat !== 'number' && typeof lat !== 'string') {
      return res.status(400).json({ error: "Faltan datos GPS: lat" });
    }
    if (typeof lng !== 'number' && typeof lng !== 'string') {
      return res.status(400).json({ error: "Faltan datos GPS: lng" });
    }

    // Normalizar
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const id = deviceId ? String(deviceId) : 'vehiculo1';
    const timestamp = Date.now();

    const point = {
      lat: latNum,
      lng: lngNum,
      timestamp,
      deviceId: id
    };

    // 1) Actualizar posición "actual" (compatibilidad con frontend)
    await db.ref(id).set(point); // mantiene /vehiculo1 como antes (o /{deviceId})

    // 2) Guardar en historial por día: /historial/{deviceId}/{YYYY-MM-DD}/{timestamp}
    const date = formatDateYYYYMMDD(timestamp);
    const histRef = db.ref(`historial/${id}/${date}/${timestamp}`);
    await histRef.set(point);

    return res.json({ status: "OK", saved: point });
  } catch (err) {
    console.error("Error en /gps:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get('/', (req, res) => res.send('Backend GPS con historial activo'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server en puerto ${PORT}`));

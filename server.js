import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});


const db = admin.database();

app.post("/gps", async (req, res) => {
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "Datos GPS incompletos" });
  }

  try {
    await db.ref("vehiculo1").set({
      lat,
      lng,
      timestamp: Date.now(),
    });

    res.json({ status: "OK" });
  } catch (error) {
    console.error("Error Firebase:", error);
    res.status(500).json({ error: "Error guardando datos" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend GPS activo");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server en puerto", PORT));

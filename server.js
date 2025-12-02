import express from "express";
import cors from "cors";
import { db } from "./firebase.js";
import { ref, set } from "firebase/database";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/gps", async (req, res) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Datos GPS incompletos" });
  }

  try {
    await set(ref(db, "vehiculo1"), {
      lat,
      lng,
      timestamp: Date.now(),
    });

    res.json({ status: "OK" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando datos" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend GPS activo 🚀");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server en puerto", PORT));

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "festo-telegram",
    timestamp: new Date().toISOString()
  });
});

const miniAppPath = path.join(__dirname, "../mini-app/dist");

app.use(express.static(miniAppPath));

app.use((_req, res) => {
  res.sendFile(path.join(miniAppPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🔥 FESTO server running on port ${PORT}`);
});

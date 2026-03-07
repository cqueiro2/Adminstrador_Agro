import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("animals.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS animals (
    id TEXT PRIMARY KEY,
    raca TEXT NOT NULL,
    cor TEXT NOT NULL,
    dataEntradaAnimal TEXT NOT NULL,
    quantidade INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS weights (
    id TEXT PRIMARY KEY,
    animalId TEXT NOT NULL,
    pesoEntrada REAL NOT NULL,
    dataEntradaPeso TEXT NOT NULL,
    pesoFinal REAL,
    dataSaidaPeso TEXT,
    precoEntrada REAL NOT NULL,
    precoSaida REAL,
    dataVenda TEXT,
    pesoFinalEstimado REAL,
    pesoFinalEstimadoTabela REAL,
    FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vaccines (
    id TEXT PRIMARY KEY,
    animalId TEXT NOT NULL,
    nomeVacina TEXT NOT NULL,
    dataAplicacao TEXT NOT NULL,
    dataVencimento TEXT,
    FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API ROUTES ---

  // Animals
  app.get("/api/animals", (req, res) => {
    const animals = db.prepare("SELECT * FROM animals").all();
    res.json(animals);
  });

  app.post("/api/animals", (req, res) => {
    const { id, raca, cor, dataEntradaAnimal, quantidade } = req.body;
    const stmt = db.prepare(`
      INSERT INTO animals (id, raca, cor, dataEntradaAnimal, quantidade)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, raca, cor, dataEntradaAnimal, quantidade);
    res.status(201).json({ id });
  });

  app.put("/api/animals/:id", (req, res) => {
    const { id } = req.params;
    const { raca, cor, dataEntradaAnimal, quantidade } = req.body;
    const stmt = db.prepare(`
      UPDATE animals 
      SET raca = ?, cor = ?, dataEntradaAnimal = ?, quantidade = ?
      WHERE id = ?
    `);
    stmt.run(raca, cor, dataEntradaAnimal, quantidade, id);
    res.json({ success: true });
  });

  app.delete("/api/animals/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM animals WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Bulk Animals
  app.post("/api/animals/bulk", (req, res) => {
    const animals = req.body;
    const insertAnimal = db.prepare(`
      INSERT INTO animals (id, raca, cor, dataEntradaAnimal, quantidade)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertWeight = db.prepare(`
      INSERT INTO weights (id, animalId, pesoEntrada, dataEntradaPeso, precoEntrada)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((data) => {
      for (const item of data) {
        insertAnimal.run(item.id, item.raca, item.cor, item.dataEntradaAnimal, item.quantidade);
        if (item.pesoInicial) {
          const weightId = `w-${item.id}`;
          insertWeight.run(weightId, item.id, item.pesoInicial, item.dataEntradaAnimal, 0);
        }
      }
    });

    try {
      transaction(animals);
      res.status(201).json({ success: true, count: animals.length });
    } catch (error) {
      console.error("Bulk animal import error:", error);
      res.status(500).json({ error: "Failed to import animals" });
    }
  });

  // Weights
  app.get("/api/weights", (req, res) => {
    const weights = db.prepare("SELECT * FROM weights").all();
    res.json(weights);
  });

  app.post("/api/weights", (req, res) => {
    const { 
      id, animalId, pesoEntrada, dataEntradaPeso, pesoFinal, 
      dataSaidaPeso, precoEntrada, precoSaida, dataVenda,
      pesoFinalEstimado, pesoFinalEstimadoTabela 
    } = req.body;
    const stmt = db.prepare(`
      INSERT INTO weights (
        id, animalId, pesoEntrada, dataEntradaPeso, pesoFinal, 
        dataSaidaPeso, precoEntrada, precoSaida, dataVenda,
        pesoFinalEstimado, pesoFinalEstimadoTabela
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, animalId, pesoEntrada, dataEntradaPeso, pesoFinal, 
      dataSaidaPeso, precoEntrada, precoSaida, dataVenda,
      pesoFinalEstimado, pesoFinalEstimadoTabela
    );
    res.status(201).json({ id });
  });

  app.put("/api/weights/:id", (req, res) => {
    const { id } = req.params;
    const { 
      pesoEntrada, dataEntradaPeso, pesoFinal, 
      dataSaidaPeso, precoEntrada, precoSaida, dataVenda,
      pesoFinalEstimado, pesoFinalEstimadoTabela 
    } = req.body;
    const stmt = db.prepare(`
      UPDATE weights 
      SET pesoEntrada = ?, dataEntradaPeso = ?, pesoFinal = ?, 
          dataSaidaPeso = ?, precoEntrada = ?, precoSaida = ?, dataVenda = ?,
          pesoFinalEstimado = ?, pesoFinalEstimadoTabela = ?
      WHERE id = ?
    `);
    stmt.run(
      pesoEntrada, dataEntradaPeso, pesoFinal, 
      dataSaidaPeso, precoEntrada, precoSaida, dataVenda,
      pesoFinalEstimado, pesoFinalEstimadoTabela, id
    );
    res.json({ success: true });
  });

  app.delete("/api/weights/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM weights WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vaccines
  app.get("/api/vaccines", (req, res) => {
    const vaccines = db.prepare("SELECT * FROM vaccines").all();
    res.json(vaccines);
  });

  app.post("/api/vaccines", (req, res) => {
    const { id, animalId, nomeVacina, dataAplicacao, dataVencimento } = req.body;
    const stmt = db.prepare(`
      INSERT INTO vaccines (id, animalId, nomeVacina, dataAplicacao, dataVencimento)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, animalId, nomeVacina, dataAplicacao, dataVencimento);
    res.status(201).json({ id });
  });

  app.put("/api/vaccines/:id", (req, res) => {
    const { id } = req.params;
    const { nomeVacina, dataAplicacao, dataVencimento } = req.body;
    const stmt = db.prepare(`
      UPDATE vaccines 
      SET nomeVacina = ?, dataAplicacao = ?, dataVencimento = ?
      WHERE id = ?
    `);
    stmt.run(nomeVacina, dataAplicacao, dataVencimento, id);
    res.json({ success: true });
  });

  app.delete("/api/vaccines/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM vaccines WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Bulk Vaccines
  app.post("/api/vaccines/bulk", (req, res) => {
    const vaccines = req.body;
    const stmt = db.prepare(`
      INSERT INTO vaccines (id, animalId, nomeVacina, dataAplicacao, dataVencimento)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((data) => {
      for (const item of data) {
        stmt.run(item.id, item.animalId, item.nomeVacina, item.dataAplicacao, item.dataVencimento);
      }
    });

    try {
      transaction(vaccines);
      res.status(201).json({ success: true, count: vaccines.length });
    } catch (error) {
      console.error("Bulk vaccine import error:", error);
      res.status(500).json({ error: "Failed to import vaccines" });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

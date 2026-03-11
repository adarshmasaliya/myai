import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("sitara.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT,
    role TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/chats", (req, res) => {
    const chats = db.prepare("SELECT * FROM chats ORDER BY updated_at DESC").all();
    res.json(chats);
  });

  app.post("/api/chats", (req, res) => {
    const { id, title } = req.body;
    db.prepare("INSERT INTO chats (id, title) VALUES (?, ?)").run(id, title);
    res.json({ success: true });
  });

  app.get("/api/chats/:id/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC").all(req.params.id);
    res.json(messages);
  });

  app.post("/api/chats/:id/messages", (req, res) => {
    const { role, content } = req.body;
    const chatId = req.params.id;
    db.prepare("INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)").run(chatId, role, content);
    db.prepare("UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(chatId);
    res.json({ success: true });
  });

  app.delete("/api/chats/:id", (req, res) => {
    db.prepare("DELETE FROM chats WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sitara AI Server running on http://localhost:${PORT}`);
  });
}

startServer();

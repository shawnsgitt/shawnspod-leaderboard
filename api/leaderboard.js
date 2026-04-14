const { kv } = require('@vercel/kv');

// Fallback in-memory store (for when KV isn't configured)
let memStore = [];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  
  if (req.method === 'GET') {
    try {
      const board = await kv.get('leaderboard') || [];
      return res.json(board);
    } catch {
      return res.json(memStore);
    }
  }
  
  if (req.method === 'POST') {
    const entry = req.body;
    try {
      let board = await kv.get('leaderboard') || [];
      if (Array.isArray(entry)) {
        board = entry;
      } else {
        const idx = board.findIndex(e => e.userId === entry.userId);
        if (idx >= 0) board[idx] = entry;
        else board.push(entry);
      }
      board.sort((a, b) => (b.score || 0) - (a.score || 0));
      board.forEach((e, i) => e.rank = i + 1);
      await kv.set('leaderboard', board);
      return res.json({ ok: true, count: board.length });
    } catch {
      // Fallback
      memStore = Array.isArray(entry) ? entry : memStore;
      return res.json({ ok: true });
    }
  }
  
  res.status(405).end();
};

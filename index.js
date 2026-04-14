const http = require('http');
const fs = require('fs');

const DATA_FILE = '/tmp/leaderboard.json';

// Initialize data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/leaderboard' || req.url === '/leaderboard/') {
    if (req.method === 'GET') {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } else if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const entry = JSON.parse(body);
          const board = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          
          // If it's a full board replacement
          if (Array.isArray(entry)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(entry));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
          }
          
          // Single entry merge
          const device = entry.device || '';
          const idx = board.findIndex(e => e.userId === entry.userId);
          if (idx >= 0) board[idx] = entry;
          else board.push(entry);
          board.sort((a, b) => (b.score || 0) - (a.score || 0));
          board.forEach((e, i) => e.rank = i + 1);
          fs.writeFileSync(DATA_FILE, JSON.stringify(board));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, count: board.length }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    }
  } else if (req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Leaderboard API on port ${PORT}`));

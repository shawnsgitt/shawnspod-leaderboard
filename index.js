const http = require('http');
let board = [];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(board));
    return;
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.action === 'sync') {
          // Merge: replace entries from this device, keep others
          const deviceId = data.device || '';
          const entries = data.entries || [];
          board = board.filter(e => e.device !== deviceId).concat(entries);
          board.sort((a, b) => (b.score || 0) - (a.score || 0));
          board.forEach((e, i) => e.rank = i + 1);
        } else if (data.action === 'delete') {
          board = board.filter(e => e.userId !== data.userId);
          board.forEach((e, i) => e.rank = i + 1);
        } else if (data.action === 'clear') {
          board = [];
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, board }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Leaderboard API running on port ' + PORT));

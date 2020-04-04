const 
  program = require('commander'),
  express = require('express'),
  fetch = require('node-fetch'),
  app = express(),
  midMatcher = /^\d+\-\d+\-\{\d\}$/,
  midMiddleware = (req,res,next) => {
    if (req.query && req.query.mid && midMatcher.exec(req.query.mid)) {
      req.mid = req.query.mid;
      next();
    } else {
      res.status(404).end();
    }
  },
  proxy = (res,fetched) => {
    fetched
      .then(res => res.json())
      .then(json => res.send(json))
      .catch(error => res.send(error));
  },
  { createProxyMiddleware } = require('http-proxy-middleware');

program
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-e, --engineHost <host>', 'Engine Service Hostname and Port')
  .requiredOption('-m, --matchMakerHost <host>', 'Match Maker Servide Hostname and Port')
  .requiredOption('-s, --static <path>','Path to static files')

const args = program.parse(process.argv);
app.use(express.static(args.static));
console.log(`Engine Host: ${args.engineHost}`);
console.log(`MatchMakerHost Host: ${args.matchMakerHost}`);

const wsProxy = createProxyMiddleware('/', {
  target: `http://${args.engineHost}`,
  ws: true,
  logLevel: 'debug'
});

app.get('/ws',wsProxy)

app.get('/get_game', midMiddleware, 
  (req,res) => proxy(res,fetch(`http://${args.engineHost}/get_game?mid=${req.mid}`)));
app.get('/make_move', midMiddleware, 
  (req,res) => proxy(res,fetch(`http://${args.engineHost}/make_move?mid=${req.mid}&row=${req.query.row}&col=${req.query.col}&number=${req.query.number}`)));

app.get('/create_match', 
  (req,res) => proxy(res,fetch(`http://${args.matchMakerHost}/create_match?p1=${req.query.p1}&p2=${req.query.p2}`)));
app.get('/accept_match', midMiddleware, 
  (req,res) => proxy(res,fetch(`http://${args.matchMakerHost}/create_match?mid=${req.mid}`)))


app.listen(args.port, () => console.log(`Sudoku Engine Listening on ${args.port}!`));
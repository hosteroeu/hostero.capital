var express = require('express');
var request = require('request');
var crequest = require('cached-request')(request);
var compression = require('compression');
var mustacheExpress = require('mustache-express');
var app = express();
var port = process.env.PORT || 3000;
var WEBDSCAN_TOKEN = 'Zjg5YjEwZWVhZWZlM2I5NmY0MTg4NDc3YTUwMmQ2NDkwMjY3MTkwZDVlNjUwNjc5OGM0YTdjOGQ1ZmI2NjgyZg';
var FOND_ADDRESS = 'WEBD$gCLz8n$U3@h9Ui5rtmtGFuVrWMKVRSy7cT$';

crequest.setCacheDirectory('tmp');

function get_transactions(callback, address) {
  var url = 'https://www.webdscan.io/api/transactions?address=' + encodeURIComponent(address);

  crequest({
    url: url,
    ttl: 3600 * 1000, // 1h
    auth: {
      bearer: WEBDSCAN_TOKEN
    },
    headers: {
      accept: 'application/json'
    }
  }, function(error, response, body) {
    var coins = JSON.parse(body);

    callback(error, coins);
  });
}

function render_404(req, res) {
  res.status(404).render('404', {
    title: 'Page not found',
    description: 'The page you requested couldn\'t be found.',
    link: 'https://www.webdollar.fund',
    keywords: 'mining, software, crypto, cpu, statistics, miner, universal cpu miner, cpu miner, webdollar, nerva, webchain'
  });
}

app.engine('html', mustacheExpress());

app.use(compression());

app.get('/*', function(req, res, next) {
  if (req.url.indexOf('/assets/') === 0) {
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
  }

  next();
});

app.use('/assets', express.static('assets'));

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.all(/.*/, function(req, res, next) {
  var host = req.header('host');

  console.log(req.method, req.url);

  if (host.match(/^www\..*/i) || host.match(/^localhost*/i)) {
    next();
  } else {
    var url = req.url || '';

    res.redirect(301, 'https://www.' + host + url);
  }
});

app.get('/robots.txt', function(req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow:\nSitemap: https://www.webdollar.fund/sitemap.xml");
});

get_transactions(function(err, res) {
  var total_amount_staked = 0;
  var deposits = res.length;

  for (var i=0;i<deposits;i++) {
    var t = res[i];

    total_amount_staked += parseInt(t.amount.amount) / 10000;

    console.log(t);
  }

  console.log(total_amount_staked);
}, FOND_ADDRESS);

app.get('/', function(req, res) {
  get_transactions(function(err, res) {
    var total_amount_staked = 0;
    var deposits = res.length;

    for (var i=0;i<deposits;i++) {
      var t = res[i];

      //total_amount_staked +=

      console.log(t.fromAddress);
    }

    res.render('index', {
      title: 'Start staking your WEBD, easy and convenient',
      description: 'The first WebDollar fund that allows your to stake your WEBD without having to be online 24/7',
      link: 'https://www.webdollar.fund',
      keywords: 'mining, software, crypto, stake, pos, webdollar, fund',
      deposits: deposits,

    });
  }, FOND_ADDRESS);
});

// The file is also accessible via /assets/sitemap.xml
app.get('/sitemap.xml', function(req, res) {
  res.sendFile('sitemap.xml', {
    root: __dirname + '/assets/',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  });
});

app.get('*', render_404);

app.listen(port, function() {
  console.log('webdollar.fund site listening on port', port);
});

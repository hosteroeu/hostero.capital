var express = require('express');
var request = require('request');
var crequest = require('cached-request')(request);
var compression = require('compression');
var mustacheExpress = require('mustache-express');
var app = express();
var port = process.env.PORT || 3000;

crequest.setCacheDirectory('tmp');

function render_404(req, res) {
  res.status(404).render('404', {
    title: 'Page not found',
    description: 'The page you requested couldn\'t be found.',
    link: 'https://www.hostero.eu/',
    keywords: 'mining, software, crypto, cpu, statistics, miner, universal cpu miner, cpu miner, webdollar, nerva, webchain'
  });
}

function get_coins(callback) {
  crequest({
    url: 'https://api.hostero.eu/v1/coins',
    ttl: 3600 * 1000 * 24 // 1d
  }, function(error, response, body) {
    var coins = JSON.parse(body);

    callback(error, coins);
  });
}

function get_benchmarks(callback, coin) {
  crequest({
    url: 'https://api.hostero.eu/v1/benchmarks?coin=' + coin,
    ttl: 3600 * 1000 * 24 // 1d
  }, function(error, response, body) {
    var benchmarks = JSON.parse(body);

    callback(error, benchmarks);
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
  res.send("User-agent: *\nDisallow:\nSitemap: https://www.hostero.eu/assets/sitemap.xml");
});

app.get('/', function(req, res) {
  get_coins(function(error, coins) {
    res.render('index', {
      title: 'Mining software for CPU cryptocurrencies',
      description: 'Start mining cryptocurrency in a few minutes. Mine the most profitable coins and unlock the full potential of your mining rigs.',
      link: 'https://www.hostero.eu',
      keywords: 'mining, software, crypto, cpu, statistics, miner, universal cpu miner, cpu miner, webdollar, nerva, webchain',
      coins: coins
    });
  });
});

app.get('/pricing', function(req, res) {
  res.render('pricing', {
    title: 'Subscription plans for Hostero',
    description: 'Choose your subscription based on the required number of miners. We have a wide range of subscriptions available and a free plan.',
    link: 'https://www.hostero.eu/pricing',
    keywords: 'plans, subscriptions, prices, mining, software, hardware, crypto, cpu, miner, universal cpu miner, cpu miner'
  });
});

app.get('/getting-started', function(req, res) {
  res.render('getting-started', {
    title: 'Getting Started with the CPU Miner',
    description: 'Learn how to deploy the Universal CPU Miner on your mining rigs. Follow our tutorial to install the CPU miner on your hardware.',
    link: 'https://www.hostero.eu/getting-started',
    keywords: 'get started, tutorial, mining, software, hardware, crypto, cpu, miner, universal cpu miner, cpu miner'
  });
});

app.get('/changelog', function(req, res) {
  res.render('changelog', {
    title: 'Changelog for our Mining Software',
    description: 'Find out what new features we have released. We are constantly working on improving the mining software, and make your miners profitable.',
    link: 'https://www.hostero.eu/changelog',
    keywords: 'changelog, chance log, improvements, features, mining, software, crypto, cpu, statistics, miner, universal cpu miner, cpu miner'
  });
});

app.get('/purchase-webdollar', function(req, res) {
  res.render('purchase-webdollar', {
    title: 'Purchase WebDollar, only use Escrow',
    description: 'Tutorial on how to purchase WebDollar coins from multiple sources. Use WebDollar to pay for the platform services. Purchase only with escrow.',
    link: 'https://www.hostero.eu/purchase-webdollar',
    keywords: 'purchase, webdollar, tutorial, crypto, cryptocurrencies, coins, escrow, cpu, cpu miner'
  });
});

app.get('/webdollar', function(req, res) {
  res.render('webdollar', {
    title: 'Tools and Services developed for WebDollar',
    description: 'List of tools and services developed for the WebDollar community. Crypto third-party tools that allow anybody to join the crypto space.',
    link: 'https://www.hostero.eu/webdollar',
    keywords: 'tools, services, webdollar, community, list, cpu, cpu miner, crypto'
  });
});

app.get('/cpu-mineable-coins', function(req, res) {
  get_coins(function(error, coins) {
    res.render('coins', {
      title: 'List with CPU mineable cryptocurrencies',
      description: 'Directory with CPU mineable cryptocurrencies that are integrated with our mining software. See our list with the most profitable CPU mineable coins.',
      link: 'https://www.hostero.eu/cpu-mineable-coins',
      keywords: 'directory, cpu, cpu miner, profitable, crypto, cryptocurrencies, mining software, multicurrency, list',
      coins: coins,
      coins_no: coins.length
    });
  });
});

app.get('/coins/:coin', function(req, res) {
  if (!req.params.coin) {
    return render_404(req, res);
  }

  get_coins(function(error, coins) {
    var coin;

    for (var i = 0, l = coins.length; i < l; i++) {
      if (coins[i].internal_name === req.params.coin) {
        coin = coins[i];
        break;
      }
    }

    if (!coin) {
      return render_404(req, res);
    }

    get_benchmarks(function(error, benchmarks) {
      res.render('coin', {
        title: 'Mine ' + coin.name + ' on Hostero',
        description: coin.description + '. Start mining ' + coin.name + ' in 1 minute.',
        link: 'https://www.hostero.eu/coins/' + coin.internal_name,
        keywords: coin.name + ', coin, benchmarks, directory, mine, cpu, cpu miner, crypto, cryptocurrencies, mining software, multicurrency, list',
        coin: coin,
        benchmarks: benchmarks
      });
    }, coin.internal_name);
  });
});

// The file is also accessible via /assets/install.sh
app.get('/install', function(req, res) {
  var account_id;

  if (req.query && req.query.a) {
    account_id = req.query.a;
  }

  res.set('Content-Type', 'text/plain');

  res.render('install', {
    account_id: req.query.a
  });

  /*
  res.sendFile('install.sh', {
    root: __dirname + '/assets/',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  });
  */
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

app.get('/cpu-minable-coins', function(req, res) {
  res.redirect(301, 'https://www.hostero.eu/cpu-mineable-coins');
});

app.get('/webdollar/chance.html', function(req, res) {
  res.redirect(301, 'https://calculator.wd.hostero.eu');
});

app.get('/webdollar/fallback.html', function(req, res) {
  res.redirect(301, 'http://nodes.wd.hostero.eu');
});

app.get('*', render_404);

app.listen(port, function() {
  console.log('Hostero site listening on port', port);
});

const {
  prometheusPort  
} = require('./config/config');

const http = require('http');
const url = require('url');
const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

register.setDefaultLabels({
  app: 'crawler'
})

client.collectDefaultMetrics({
  register  
})



const server = http.createServer(async (req, res) => {
  const route = url.parse(req.url).pathname;  

  if (route === '/metrics') {
    res.setHeader('Content-Type', register.contentType)
    res.write(await register.metrics());
    res.end();
  } else {
    res.end('Crawler server');
  }  
})

function startServer(callback) {
  server.listen(prometheusPort, callback);
}

module.exports = {
  startServer
}

/*const server  = http.createServer(async (req, res) => {
  

  console.log('start server');
  
  if (route === '/metrics') {
    // Return all metrics the Prometheus exposition format
    res.setHeader('Content-Type', register.contentType)
    res.end(register.metrics())
  }
})*/

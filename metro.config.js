// Custom Metro config để proxy các request /api trên web -> backend thật,
// tránh lỗi CORS khi backend không bật Access-Control-Allow-Origin.
const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const os = require('os');

// Lấy IP Wi-Fi thực tế tự động, fallback về 192.168.1.10
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
        return iface.address;
      }
    }
  }
  return '192.168.1.10';
}

const BACKEND_PROXY_TARGET =
  process.env.EXPO_BACKEND_PROXY ||
  process.env.BACKEND_URL ||
  `http://${getLocalIP()}:8000`;

const targetUrl = new URL(BACKEND_PROXY_TARGET);
const httpClient = targetUrl.protocol === 'https:' ? https : http;

function apiProxyMiddleware(req, res, next) {
  if (!req.url.startsWith('/api/') && !req.url.startsWith('/public/uploads/')) {
    return next();
  }

  const proxyOptions = {
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    method: req.method,
    path: req.url,
    headers: {
      ...req.headers,
      host: targetUrl.host,
      origin: targetUrl.origin,
      referer: targetUrl.origin,
    },
  };

  console.log(`🔁 Proxying ${req.method} ${req.url} → ${targetUrl.origin}`);

  const proxyReq = httpClient.request(proxyOptions, proxyRes => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', error => {
    console.error('❌ Proxy error:', error?.message || error);
    if (!res.headersSent) {
      res.writeHead(502);
    }
    res.end('Proxy error');
  });

  req.pipe(proxyReq, { end: true });
}

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  config.server = config.server || {};
  const originalEnhanceMiddleware = config.server.enhanceMiddleware;

  config.server.enhanceMiddleware = (middleware, server) => {
    const enhanced = (req, res, next) => apiProxyMiddleware(req, res, () => middleware(req, res, next));
    return originalEnhanceMiddleware
      ? originalEnhanceMiddleware(enhanced, server)
      : enhanced;
  };

  console.log(`🔧 Metro API proxy target: ${targetUrl.origin}`);

  return config;
})();


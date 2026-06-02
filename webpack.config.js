const createExpoWebpackConfigAsync = require('@expo/webpack-config');
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

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  if (config.devServer) {
    const localIP = getLocalIP();
    const proxyTarget = process.env.EXPO_BACKEND_PROXY || process.env.BACKEND_URL || `http://${localIP}:8000`;

    if (!config.devServer.proxy) {
      config.devServer.proxy = {};
    }

    // Proxy toàn bộ request /api để tránh CORS khi chạy web dev server
    config.devServer.proxy['/api'] = {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    };

    config.devServer.proxy['/public/uploads'] = {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    };

    console.log(`🔁 Expo web proxy enabled → ${proxyTarget}`);
  }

  return config;
};


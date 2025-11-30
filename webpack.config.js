const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  if (config.devServer) {
    const proxyTarget =
      process.env.EXPO_BACKEND_PROXY ??
      process.env.BACKEND_URL ??
      'http://192.168.1.3:8000';

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

    console.log(`🔁 Expo web proxy enabled → ${proxyTarget}`);
  }

  return config;
};


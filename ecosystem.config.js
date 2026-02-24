module.exports = {
  apps: [
    {
      name: 'historisches-backend',
      script: 'backend/server.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};

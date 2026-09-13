module.exports = {
  apps: [
    {
      name: 'newsly-api',
      script: 'dist/src/main.js',

      // Cluster mode: one instance per CPU core
      instances: 'max',
      exec_mode: 'cluster',

      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Environment — production values come from .env on the server
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/newsly/error.log',
      out_file:   '/var/log/newsly/out.log',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,

      // Restart delay between crashes
      exp_backoff_restart_delay: 100,
    },
  ],
};

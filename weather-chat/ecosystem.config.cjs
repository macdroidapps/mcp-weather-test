/**
 * PM2 конфигурация для Next.js Weather Chat
 */

module.exports = {
  apps: [
    {
      name: 'weather-chat',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: __dirname,
      
      // Переменные окружения
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Загрузка .env.local файла
      env_file: '.env.local.local',
      
      // Кластерный режим для лучшей производительности
      instances: 'max',
      exec_mode: 'cluster',
      
      // Автоперезапуск
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 1000,
      
      // Логи
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Ресурсы
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};


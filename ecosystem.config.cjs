/**
 * PM2 конфигурация для MCP Weather Server
 * 
 * Использование:
 *   pm2 start ecosystem.config.cjs
 *   pm2 stop all
 *   pm2 restart all
 *   pm2 logs
 */

module.exports = {
  apps: [
    // MCP HTTP Server (для веб-приложений)
    {
      name: 'mcp-http',
      script: 'dist/server-http.js',
      cwd: __dirname,
      
      // Переменные окружения
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
        CACHE_TTL: '300',
        MCP_HTTP_PORT: '3001',
        MCP_HTTP_HOST: '127.0.0.1',
      },
      
      // Загрузка .env файла
      env_file: '.env',
      
      // Автоперезапуск
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 1000,
      
      // Логи
      error_file: 'logs/mcp-http-error.log',
      out_file: 'logs/mcp-http-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Ресурсы
      max_memory_restart: '200M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    
    // MCP Stdio Server (для Claude Desktop) — запускается отдельно при необходимости
    // {
    //   name: 'mcp-stdio',
    //   script: 'dist/server.js',
    //   cwd: __dirname,
    //   autorestart: false,
    //   env: {
    //     NODE_ENV: 'production',
    //     LOG_LEVEL: 'info',
    //   },
    // },
  ],
};

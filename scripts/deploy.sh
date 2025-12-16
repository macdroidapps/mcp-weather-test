#!/bin/bash
# Скрипт развёртывания MCP Weather Server и Next.js приложения

set -e

echo "🚀 Начинаем развёртывание Weather Chat..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Проверка зависимостей
check_dependencies() {
    echo -e "${YELLOW}Проверка зависимостей...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js не установлен!${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm не установлен!${NC}"
        exit 1
    fi
    
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}Устанавливаем PM2...${NC}"
        npm install -g pm2
    fi
    
    echo -e "${GREEN}✓ Все зависимости в порядке${NC}"
}

# Установка MCP сервера
install_mcp_server() {
    echo -e "${YELLOW}Устанавливаем MCP Weather Server...${NC}"
    
    cd "$(dirname "$0")/.."
    
    # Установка зависимостей
    npm install
    
    # Сборка TypeScript
    npm run build
    
    # Создание директории для логов
    mkdir -p logs
    
    echo -e "${GREEN}✓ MCP сервер установлен${NC}"
}

# Установка Next.js приложения
install_nextjs() {
    echo -e "${YELLOW}Устанавливаем Next.js приложение...${NC}"
    
    cd "$(dirname "$0")/../weather-chat"
    
    # Установка зависимостей
    npm install
    
    # Сборка
    npm run build
    
    # Создание директории для логов
    mkdir -p logs
    
    echo -e "${GREEN}✓ Next.js приложение установлено${NC}"
}

# Проверка переменных окружения
check_env() {
    echo -e "${YELLOW}Проверка переменных окружения...${NC}"
    
    cd "$(dirname "$0")/.."
    
    if [ ! -f ".env" ]; then
        echo -e "${RED}Файл .env не найден!${NC}"
        echo "Создайте .env на основе .env.example"
        exit 1
    fi
    
    cd weather-chat
    
    if [ ! -f ".env.local" ]; then
        echo -e "${RED}Файл weather-chat/.env.local не найден!${NC}"
        echo "Создайте .env.local с YANDEX_WEATHER_API_KEY и ANTHROPIC_API_KEY"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Переменные окружения настроены${NC}"
}

# Запуск сервисов
start_services() {
    echo -e "${YELLOW}Запускаем сервисы через PM2...${NC}"
    
    cd "$(dirname "$0")/../weather-chat"
    
    # Запуск Next.js
    pm2 start ecosystem.config.cjs --env production
    
    # Сохранение конфигурации PM2
    pm2 save
    
    # Настройка автозапуска
    pm2 startup
    
    echo -e "${GREEN}✓ Сервисы запущены${NC}"
}

# Статус сервисов
status() {
    echo -e "${YELLOW}Статус сервисов:${NC}"
    pm2 status
}

# Основное выполнение
main() {
    case "${1:-deploy}" in
        deploy)
            check_dependencies
            install_mcp_server
            install_nextjs
            check_env
            start_services
            status
            echo -e "${GREEN}🎉 Развёртывание завершено!${NC}"
            ;;
        start)
            start_services
            ;;
        stop)
            pm2 stop all
            ;;
        restart)
            pm2 restart all
            ;;
        status)
            status
            ;;
        logs)
            pm2 logs
            ;;
        *)
            echo "Использование: $0 {deploy|start|stop|restart|status|logs}"
            exit 1
            ;;
    esac
}

main "$@"


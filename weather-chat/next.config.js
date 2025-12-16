/** @type {import('next').NextConfig} */
const nextConfig = {
  // Включаем строгий режим React
  reactStrictMode: true,
  
  // Экспериментальные функции
  experimental: {
    // Server Actions по умолчанию включены в Next.js 14+
  },
};

module.exports = nextConfig;


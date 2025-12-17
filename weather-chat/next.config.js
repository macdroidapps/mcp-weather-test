/** @type {import('next').NextConfig} */
const nextConfig = {
  // Включаем строгий режим React
  reactStrictMode: true,
  
  // Включаем instrumentation для инициализации планировщика
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;


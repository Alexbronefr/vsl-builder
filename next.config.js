/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Увеличиваем лимит размера тела запроса для загрузки GIF (50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async headers() {
    return [
      {
        // Разрешаем встраивание только для embed-роутов
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

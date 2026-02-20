/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Увеличиваем лимит размера тела запроса для загрузки GIF (10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig

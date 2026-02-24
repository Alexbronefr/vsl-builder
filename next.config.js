/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Увеличиваем лимит размера тела запроса для загрузки GIF (50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */

const isStatic = process.env.STATIC_EXPORT === 'true'

const nextConfig = {
  ...(isStatic && { output: 'export' }),
  trailingSlash: true,

  // better-sqlite3 = 네이티브 바이너리 → Next.js 번들러에서 제외 필수
  serverExternalPackages: ['better-sqlite3'],

  images: { unoptimized: true },
}

module.exports = nextConfig

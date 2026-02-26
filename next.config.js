/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@arcgis/core'],
}

module.exports = nextConfig

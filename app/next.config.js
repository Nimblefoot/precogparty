/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["page.tsx", "page.ts", "page.jsx", "page.js"],
  images: {
    domains: ["www.arweave.net"],
  },
  ignorePatterns: ["**/*.stories.tsx", "**/stories/*.tsx"],
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    })
    return config
  },
}

module.exports = nextConfig

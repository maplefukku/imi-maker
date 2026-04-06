import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // パフォーマンス最適化
  reactStrictMode: true,

  // 実験的機能
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;

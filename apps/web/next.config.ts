import type { NextConfig } from "next";
import { webpack } from "next/dist/compiled/webpack/webpack";

const nextConfig: NextConfig = {
  async rewrites() {
    // Mock server: http://localhost:4040 (no /api/v1 prefix)
    // Real backend: http://localhost:8080/api/v1
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

    if (!backendUrl.endsWith("4040")) {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${backendUrl}/api/v1/:path*`,
        }
      ]
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

  // Webpack 配置（用于处理 webtorrent 等客户端包）
  webpack: (config, { isServer }) => {
    // 在服务器端将 webtorrent 相关包标记为外部依赖
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('webtorrent');
      config.externals.push('bittorrent-tracker');
      config.externals.push('simple-peer');
      config.externals.push('webrtc-polyfill');
      config.externals.push('node-datachannel');
    }

    // 客户端：配置模块解析
    if (!isServer) {
      // 对于包含原生模块的依赖，使用 browser 字段替代
      config.resolve.alias = {
        ...config.resolve.alias,
        'node-datachannel': false,
      };
      // 仅在客户端构建时注入 global 变量
      config.plugins.push(
        new webpack.DefinePlugin({
          global: 'globalThis', 
        })
      );
    }

    return config;
  },
};

export default nextConfig;

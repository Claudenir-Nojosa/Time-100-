// next.config.js
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"], // Permite imagens do Google
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      // A logo do onboarding vai como data URL no createBrand — o limite
      // default de 1MB fazia a action lançar erro com logos maiores.
      // UI permite arquivo de até 5MB (~6.7MB em base64).
      bodySizeLimit: '8mb',
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: 'storage.fal.media' },
      { protocol: 'https', hostname: 'v3.fal.media' },
      // Supabase Storage (uploads do editor editorial)
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
}

export default nextConfig

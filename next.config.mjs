/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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

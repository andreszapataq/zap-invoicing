/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Solo desarrollo: permite abrir `next dev` desde el celular en la red local (IP del Mac)
  allowedDevOrigins: ["192.168.1.13"],
};

module.exports = nextConfig;

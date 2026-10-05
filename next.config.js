/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  allowedDevOrigins: ['192.168.56.1', 'localhost:3000', '127.0.0.1:3000', '172.20.10.8'],
};

module.exports = nextConfig;
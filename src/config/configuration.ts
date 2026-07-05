export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_NAME ?? 'vuln_lab',
  },
  jwt: {
    privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH ?? 'keys/private.pem',
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH ?? 'keys/public.pem',
    expiresIn: '24h',
  },
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  imagemagickCmd: process.env.IMAGEMAGICK_CMD ?? 'magick',
});
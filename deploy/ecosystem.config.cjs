// PM2: mantiene Next.js corriendo en el VPS y lo reinicia si se cae o tras reiniciar el servidor.
// Uso (desde la carpeta del proyecto):  pm2 start deploy/ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "snapslide",
      cwd: __dirname + "/..",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: { NODE_ENV: "production", PORT: 3000 },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};

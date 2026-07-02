/**
 * PM2 config — run from backend folder:
 *   pm2 start ../deploy/ecosystem.config.cjs
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: "rankage-api",
      cwd: "/var/www/rankageshop/backend",
      script: "dist/src/main.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

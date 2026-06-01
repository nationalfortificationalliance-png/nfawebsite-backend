#!/usr/bin/env node

const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

console.log('\n=== STRAPI ENVIRONMENT VARIABLES ===\n');
console.log('Copy these values to your Railway dashboard:\n');

console.log('# Server Configuration (Keep these as-is)');
console.log('NODE_ENV=production');
console.log('HOST=0.0.0.0');
console.log('PORT=1337');
console.log('');

console.log('# Database Configuration (Railway auto-provides DATABASE_URL)');
console.log('DATABASE_CLIENT=postgres');
console.log('DATABASE_SSL=false');
console.log('# DATABASE_URL will be automatically set by Railway when you add PostgreSQL');
console.log('');

console.log('# Security Secrets (REPLACE IN RAILWAY - DO NOT use these placeholders!)');
console.log(`APP_KEYS=${generateSecret()},${generateSecret()},${generateSecret()},${generateSecret()}`);
console.log(`API_TOKEN_SALT=${generateSecret()}`);
console.log(`ADMIN_JWT_SECRET=${generateSecret()}`);
console.log(`TRANSFER_TOKEN_SALT=${generateSecret()}`);
console.log(`JWT_SECRET=${generateSecret()}`);
console.log(`ENCRYPTION_KEY=${generateSecret()}`);
console.log('');

console.log('# Optional: Frontend CORS (add your frontend URL)');
console.log('# FRONTEND_URL=https://your-frontend-domain.com,http://localhost:3000');
console.log('\n=== END ===\n');

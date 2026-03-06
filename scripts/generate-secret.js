#!/usr/bin/env node

/**
 * Скрипт для генерации SESSION_SECRET
 * Запуск: node scripts/generate-secret.js
 */

import crypto from 'crypto';

console.log("🔑 Генерация SESSION_SECRET...\n");

// Генерируем случайную строку длиной 64 символа
const secret = crypto.randomBytes(32).toString('hex');

console.log("✅ Сгенерированный SESSION_SECRET:");
console.log(secret);
console.log("\n📝 Скопируйте этот ключ и добавьте в .env файл:");
console.log(`SESSION_SECRET=${secret}`);
console.log("\n⚠️  ВАЖНО: Не используйте этот ключ в production без перегенерации!");
console.log("   Каждый запуск скрипта генерирует новый уникальный ключ.");
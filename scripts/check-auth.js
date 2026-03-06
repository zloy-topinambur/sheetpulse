#!/usr/bin/env node

/**
 * Скрипт для проверки аутентификации Shopify приложения
 * Запуск: node scripts/check-auth.js
 */

import dotenv from "dotenv";
import fs from "fs";

// Загружаем переменные окружения
dotenv.config();

console.log("🔍 Проверка конфигурации Shopify приложения...\n");

// Проверка наличия .env файла
if (!fs.existsSync('.env')) {
  console.error("❌ Отсутствует файл .env");
  console.log("💡 Скопируйте .env.example в .env и заполните значениями");
  process.exit(1);
}

console.log("✅ Файл .env присутствует");

// Проверка обязательных переменных окружения
const requiredEnvVars = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET', 
  'SHOPIFY_APP_URL',
  'DATABASE_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Отсутствуют обязательные переменные окружения:");
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log("\n💡 Заполните .env файл согласно шаблону");
  process.exit(1);
}

console.log("✅ Обязательные переменные окружения:");
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const maskedValue = value.length > 10 
    ? value.substring(0, 10) + "..." 
    : value;
  console.log(`   - ${varName}: ${maskedValue}`);
});

// Проверка URL
const appUrl = process.env.SHOPIFY_APP_URL;
if (!appUrl.startsWith('http')) {
  console.error(`\n❌ Некорректный SHOPIFY_APP_URL: ${appUrl}`);
  console.log("💡 URL должен начинаться с http:// или https://");
  process.exit(1);
}

console.log(`\n✅ SHOPIFY_APP_URL: ${appUrl}`);

// Проверка scopes
const scopes = process.env.SCOPES;
if (!scopes) {
  console.error("❌ Отсутствуют SCOPES в .env файле");
  process.exit(1);
}

console.log(`✅ SCOPES: ${scopes}`);

// Проверка embedded режима
const embedded = process.env.EMBEDDED !== 'false';
console.log(`✅ Embedded режим: ${embedded ? 'включен' : 'выключен'}`);

console.log("\n🎉 Конфигурация проверена успешно!");
console.log("\n🚀 Для запуска приложения:");
console.log("   npm run dev - для локальной разработки");
console.log("   npm run build && npm start - для production");

console.log("\n📝 Важные моменты:");
console.log("   1. Приложение должно открываться ТОЛЬКО из Shopify Admin");
console.log("   2. Для локальной разработки используйте ngrok или Shopify CLI");
console.log("   3. Убедитесь, что DATABASE_URL ведет на рабочую PostgreSQL базу");
console.log("   4. Проверьте, что redirect URLs в shopify.app.toml совпадают с настройками в Partner Dashboard");

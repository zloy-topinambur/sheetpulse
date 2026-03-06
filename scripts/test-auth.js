#!/usr/bin/env node

/**
 * Скрипт для тестирования аутентификации Shopify приложения
 * Запуск: node scripts/test-auth.js
 */

import dotenv from "dotenv";
import fs from "fs";

// Загружаем переменные окружения
dotenv.config();

console.log("🧪 Тестирование аутентификации Shopify приложения...\n");

// Проверка наличия .env файла
if (!fs.existsSync('.env')) {
  console.error("❌ Отсутствует файл .env");
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
  process.exit(1);
}

console.log("✅ Обязательные переменные окружения заполнены");

// Проверка URL
const appUrl = process.env.SHOPIFY_APP_URL;
if (!appUrl.startsWith('http')) {
  console.error(`\n❌ Некорректный SHOPIFY_APP_URL: ${appUrl}`);
  process.exit(1);
}

console.log(`✅ SHOPIFY_APP_URL: ${appUrl}`);

// Проверка scopes
const scopes = process.env.SCOPES;
if (!scopes) {
  console.error("❌ Отсутствуют SCOPES в .env файле");
  process.exit(1);
}

console.log(`✅ SCOPES: ${scopes}`);

// Проверка shopify.app.toml
if (!fs.existsSync('shopify.app.toml')) {
  console.error("❌ Отсутствует файл shopify.app.toml");
  process.exit(1);
}

const shopifyConfig = fs.readFileSync('shopify.app.toml', 'utf8');

if (!shopifyConfig.includes('embedded = true')) {
  console.error("❌ Приложение не настроено как embedded");
  process.exit(1);
}

console.log("✅ Приложение настроено как embedded");

// Проверка наличия webhook маршрута
if (!fs.existsSync('app/routes/webhooks.jsx')) {
  console.error("❌ Отсутствует маршрут для webhook'ов");
  process.exit(1);
}

console.log("✅ Маршрут для webhook'ов присутствует");

// Проверка биллинговой страницы
if (!fs.existsSync('app/routes/app.billing.jsx')) {
  console.error("❌ Отсутствует биллинговая страница");
  process.exit(1);
}

console.log("✅ Биллинговая страница присутствует");

console.log("\n🎉 Все проверки пройдены успешно!");
console.log("\n📝 Рекомендации:");
console.log("   1. Убедитесь, что DATABASE_URL ведет на рабочую PostgreSQL базу");
console.log("   2. Проверьте, что redirect URLs в shopify.app.toml совпадают с настройками в Partner Dashboard");
console.log("   3. Убедитесь, что webhook'и настроены в Shopify Partner Dashboard");
console.log("   4. Протестируйте приложение через Shopify Admin");

console.log("\n🚀 Для запуска приложения:");
console.log("   npm run dev - для локальной разработки");
console.log("   npm run build && npm start - для production");
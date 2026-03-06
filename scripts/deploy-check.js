#!/usr/bin/env node

/**
 * Скрипт для проверки готовности к развертыванию на Render
 * Запуск: node scripts/deploy-check.js
 */

import fs from 'fs';
import path from 'path';

console.log("🚀 Проверка готовности к развертыванию на Render...\n");

// Проверка наличия всех необходимых файлов
const requiredFiles = [
  'package.json',
  'remix.config.js', 
  'vite.config.js',
  'shopify.app.toml',
  'shopify.web.toml',
  'vercel.json',
  'app/shopify.server.js',
  'app/db.server.js',
  'prisma/schema.prisma'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error("❌ Отсутствуют обязательные файлы:");
  missingFiles.forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

console.log("✅ Все обязательные файлы присутствуют");

// Проверка package.json скриптов
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'setup'];

const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);

if (missingScripts.length > 0) {
  console.error("❌ Отсутствуют обязательные скрипты в package.json:");
  missingScripts.forEach(script => console.error(`   - ${script}`));
  process.exit(1);
}

console.log("✅ Все необходимые скрипты присутствуют");

// Проверка конфигурации Render
const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

if (!vercelJson.buildCommand || !vercelJson.outputDirectory) {
  console.error("❌ Некорректная конфигурация в vercel.json");
  console.log("💡 Должны быть указаны buildCommand и outputDirectory");
  process.exit(1);
}

console.log("✅ Конфигурация Render корректна");

// Проверка .env.example
if (!fs.existsSync('.env.example')) {
  console.error("❌ Отсутствует .env.example файл");
  process.exit(1);
}

console.log("✅ Файл .env.example присутствует");

// Проверка Prisma конфигурации
const prismaSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!prismaSchema.includes('datasource db') || !prismaSchema.includes('provider = "postgresql"')) {
  console.error("❌ Некорректная конфигурация Prisma для PostgreSQL");
  console.log("💡 Убедитесь, что в schema.prisma используется PostgreSQL datasource");
  process.exit(1);
}

console.log("✅ Конфигурация Prisma корректна");

// Проверка shopify.app.toml
const shopifyConfig = fs.readFileSync('shopify.app.toml', 'utf8');

if (!shopifyConfig.includes('embedded = true')) {
  console.error("❌ Приложение не настроено как embedded");
  console.log("💡 Убедитесь, что в shopify.app.toml указано embedded = true");
  process.exit(1);
}

console.log("✅ Приложение настроено как embedded");

// Проверка наличия биллинговой логики
const billingFile = 'app/routes/app.billing.jsx';
if (!fs.existsSync(billingFile)) {
  console.error("❌ Отсутствует биллинговая страница");
  process.exit(1);
}

console.log("✅ Биллинговая система присутствует");

console.log("\n🎉 Проверка завершена успешно!");
console.log("\n📋 Для развертывания на Render:");
console.log("   1. Создайте новый Web Service в Render Dashboard");
console.log("   2. Подключите GitHub репозиторий");
console.log("   3. Укажите команды:");
console.log("      - Build Command: npm run build");
console.log("      - Start Command: npm start");
console.log("      - Output Directory: build");
console.log("   4. Добавьте переменные окружения (см. .env.example)");
console.log("   5. Настройте PostgreSQL базу данных");

console.log("\n🔧 Переменные окружения для Render:");
console.log("   - SHOPIFY_API_KEY: ваш API ключ");
console.log("   - SHOPIFY_API_SECRET: ваш API secret");
console.log("   - SHOPIFY_APP_URL: https://ваш-сервис.onrender.com");
console.log("   - DATABASE_URL: URL вашей PostgreSQL базы");
console.log("   - SCOPES: read_customers,write_customers,read_orders,read_products,write_products,write_script_tags");

console.log("\n⚠️  Важные моменты:");
console.log("   - Убедитесь, что DATABASE_URL ведет на рабочую PostgreSQL базу");
console.log("   - Обновите SHOPIFY_APP_URL в shopify.app.toml");
console.log("   - Настройте redirect URLs в Shopify Partner Dashboard");
console.log("   - Протестируйте приложение после развертывания");
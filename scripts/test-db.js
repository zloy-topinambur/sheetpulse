#!/usr/bin/env node

/**
 * Скрипт для проверки подключения к базе данных
 * Запуск: node scripts/test-db.js
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Загружаем переменные окружения
dotenv.config();

console.log("🔍 Проверка подключения к базе данных...\n");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Подключение к базе данных успешно");
    
    // Проверим сессии
    const sessions = await prisma.session.findMany({ take: 1 });
    console.log("✅ Таблица сессий доступна");
    console.log(`   Найдено сессий: ${sessions.length}`);
    
    await prisma.$disconnect();
    console.log("\n🎉 Все проверки базы данных пройдены!");
  } catch (error) {
    console.error("❌ Ошибка подключения к базе:", error.message);
    console.error("\n💡 Возможные причины:");
    console.error("   - DATABASE_URL не указан или некорректен");
    console.error("   - База данных недоступна");
    console.error("   - Нет прав доступа к базе");
    process.exit(1);
  }
}

testConnection();
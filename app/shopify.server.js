// Load environment variables
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  BillingInterval,
  ApiVersion,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
import prisma from "./db.server";

// Функция для правильного формирования URL
function getAppUrl() {
  const url = process.env.SHOPIFY_APP_URL || process.env.APP_URL;
  if (!url) return "http://localhost:3000";
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.October24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: getAppUrl(),
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.Undefined,
  restResources,
  
  // БИЛЛИНГ: $4.99/месяц с бесплатным периодом
  // Shopify автоматически дает trial при первой оплате
  billing: {
    "Monthly Subscription": {
      amount: 4.99,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
      trialDays: 7, // 7 дней бесплатно
      replacementBehavior: 'APPLY_IMMEDIATELY',
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      console.log("✅ Аутентификация успешна для магазина:", session.shop);
      shopify.registerWebhooks({ session });
    },
  },

  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      console.log("✅ Аутентификация успешна для магазина:", session.shop);
      shopify.registerWebhooks({ session });
    },
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
    unstable_newEmbeddedAuthStrategy: true,
  },
  // ВАЖНО: SESSION_SECRET обязателен для production
  sessionSecret: process.env.SESSION_SECRET,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const api = shopify.api;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const sessionStorage = shopify.sessionStorage;

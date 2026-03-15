var _a;
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer, useLoaderData, Meta, Links, Outlet, ScrollRestoration, Scripts, useActionData, useSubmit, useNavigation, useNavigate, Form, Link as Link$1, useRouteError } from "@remix-run/react";
import { createReadableStreamFromReadable, json, redirect } from "@remix-run/node";
import { isbot } from "isbot";
import { config } from "dotenv";
import "@shopify/shopify-app-remix/adapters/node";
import { shopifyApp, DeliveryMethod, BillingInterval, AppDistribution, ApiVersion, boundary } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
import { PrismaClient } from "@prisma/client";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Page, Card, Text, Button, Layout, BlockStack, Link, List, Box, Banner, Divider, TextField, InlineStack, Badge, Select, Checkbox } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}
const prisma = global.prismaGlobal ?? new PrismaClient();
config();
function getAppUrl() {
  const url = process.env.SHOPIFY_APP_URL || process.env.APP_URL;
  if (!url) return "http://localhost:3000";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}
async function ensureAppUrlMetafield(admin) {
  var _a2, _b;
  try {
    const appUrl = getAppUrl();
    const appRes = await admin.graphql(`{currentAppInstallation{id}}`);
    const appResData = await appRes.json();
    const appId = (_b = (_a2 = appResData.data) == null ? void 0 : _a2.currentAppInstallation) == null ? void 0 : _b.id;
    if (!appId) return;
    await admin.graphql(
      `mutation setAppUrl($m:[MetafieldsSetInput!]!){
        metafieldsSet(metafields:$m){
          metafields{namespace key value}
          userErrors{field message}
        }
      }`,
      {
        variables: {
          m: [
            {
              namespace: "sheet_pulse",
              key: "app_url",
              type: "single_line_text_field",
              value: appUrl,
              ownerId: appId
            }
          ]
        }
      }
    );
  } catch (e) {
    console.warn("⚠️ Failed to ensure app_url metafield:", e);
  }
}
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.October24,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
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
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
      trialDays: 7,
      // 7 дней бесплатно
      replacementBehavior: "APPLY_IMMEDIATELY"
    }
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      console.log("✅ Аутентификация успешна для магазина:", session.shop);
      shopify.registerWebhooks({ session });
      if (admin) {
        await ensureAppUrlMetafield(admin);
      }
    }
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks"
    }
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
    unstable_newEmbeddedAuthStrategy: true
  },
  // ВАЖНО: SESSION_SECRET обязателен для production
  sessionSecret: process.env.SESSION_SECRET,
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
shopify.api;
const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
shopify.unauthenticated;
const login = shopify.login;
shopify.sessionStorage;
const streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url }),
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const polarisStyles = "/assets/styles-CV7GIAUv.css";
const links = () => [
  { rel: "stylesheet", href: polarisStyles }
];
const loader$8 = async ({ request }) => {
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "89faf3e331fad9beb46658573ca89bcc"
  });
};
function App$2() {
  const { apiKey } = useLoaderData();
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx("meta", { name: "shopify-api-key", content: apiKey }),
      /* @__PURE__ */ jsx("script", { src: "https://cdn.shopify.com/shopifycloud/app-bridge.js" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(AppProvider, { isEmbeddedApp: true, apiKey, children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App$2,
  links,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
const action$6 = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;
  if (session) {
    await prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        scope: current.toString()
      }
    });
  }
  return new Response();
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6
}, Symbol.toStringTag, { value: "Module" }));
const action$5 = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  if (session) {
    await prisma.session.deleteMany({ where: { shop } });
  }
  return new Response();
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5
}, Symbol.toStringTag, { value: "Module" }));
async function loader$7({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;
    const metafieldsResponse = await fetch(
      `https://${shop}/admin/api/2024-10/metafields.json?namespace=sheet_pulse&owner_resource=app&owner_id=${session.shop}`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        }
      }
    );
    if (!metafieldsResponse.ok) {
      throw new Error(`Failed to fetch metafields: ${metafieldsResponse.status}`);
    }
    const metafieldsData = await metafieldsResponse.json();
    const metafields = metafieldsData.metafields || [];
    const metafieldsObj = {};
    metafields.forEach((mf) => {
      metafieldsObj[mf.key] = mf.value;
    });
    const config2 = {
      questions: metafieldsObj.q_json || [],
      googleUrl: metafieldsObj.g_url || "",
      triggerType: metafieldsObj.t_type || "timer",
      tVal: metafieldsObj.t_val || "3",
      targetDevice: metafieldsObj.t_dev || "all",
      accentColor: metafieldsObj.a_col || "000000",
      lang: metafieldsObj.lang || "en",
      status: metafieldsObj.status || "inactive",
      surveyVersion: metafieldsObj.survey_version || "",
      widgetPosition: metafieldsObj.w_pos || "right"
    };
    return json(config2);
  } catch (error) {
    console.error("Error fetching survey config:", error);
    return json(
      { error: "Failed to fetch survey configuration" },
      { status: 500 }
    );
  }
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
const loader$6 = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};
const action$4 = async ({ request }) => {
  var _a2, _b;
  const { session, admin } = await authenticate.admin(request);
  try {
    const appRes = await admin.graphql(`{currentAppInstallation{id}}`);
    const appResData = await appRes.json();
    if (appResData.errors) {
      return json({
        success: false,
        message: `Failed to read currentAppInstallation.id: ${JSON.stringify(appResData.errors)}`
      });
    }
    const appId = appResData.data.currentAppInstallation.id;
    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL || getAppUrl();
    const result = await admin.graphql(
      `mutation set($m:[MetafieldsSetInput!]!){
        metafieldsSet(metafields:$m){
          metafields{namespace key value}
          userErrors{field message}
        }
      }`,
      {
        variables: {
          m: [
            {
              namespace: "sheet_pulse",
              key: "app_url",
              type: "single_line_text_field",
              value: appUrl,
              ownerId: appId
            }
          ]
        }
      }
    );
    const resultData = await result.json();
    const userErrors = ((_b = (_a2 = resultData.data) == null ? void 0 : _a2.metafieldsSet) == null ? void 0 : _b.userErrors) || [];
    return json({
      success: userErrors.length === 0,
      message: userErrors.length === 0 ? "✅ app_url metafield updated. Note: Theme App Extension updates still require Shopify CLI deploy." : `Metafield update errors: ${JSON.stringify(userErrors)}`
    });
  } catch (error) {
    return json({ success: false, message: "Error updating widget" });
  }
};
function UpdateWidget() {
  const { shop } = useLoaderData();
  const actionData = useActionData();
  return /* @__PURE__ */ jsx(Page, { title: "Update Widget", children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "Widget Sync" }),
    /* @__PURE__ */ jsx(Text, { variant: "bodyMd", as: "p", color: "subdued", children: "Ensures your store has correct app URL for loading widget assets." }),
    (actionData == null ? void 0 : actionData.success) && /* @__PURE__ */ jsxs("div", { style: { color: "green", margin: "10px 0" }, children: [
      "✅ ",
      actionData.message
    ] }),
    (actionData == null ? void 0 : actionData.success) === false && /* @__PURE__ */ jsxs("div", { style: { color: "red", margin: "10px 0" }, children: [
      "❌ ",
      actionData.message
    ] }),
    /* @__PURE__ */ jsx("form", { method: "post", children: /* @__PURE__ */ jsx(Button, { primary: true, type: "submit", children: "Sync Widget" }) })
  ] }) });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: UpdateWidget,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
function AdditionalPage() {
  return /* @__PURE__ */ jsxs(Page, { children: [
    /* @__PURE__ */ jsx(TitleBar, { title: "Additional page" }),
    /* @__PURE__ */ jsxs(Layout, { children: [
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodyMd", children: [
          "The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using",
          " ",
          /* @__PURE__ */ jsx(
            Link,
            {
              url: "https://shopify.dev/docs/apps/tools/app-bridge",
              target: "_blank",
              removeUnderline: true,
              children: "App Bridge"
            }
          ),
          "."
        ] }),
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "bodyMd", children: [
          "To create your own page and have it show up in the app navigation, add a page inside ",
          /* @__PURE__ */ jsx(Code, { children: "app/routes" }),
          ", and a link to it in the ",
          /* @__PURE__ */ jsx(Code, { children: "<NavMenu>" }),
          " component found in ",
          /* @__PURE__ */ jsx(Code, { children: "app/routes/app.jsx" }),
          "."
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Resources" }),
        /* @__PURE__ */ jsx(List, { children: /* @__PURE__ */ jsx(List.Item, { children: /* @__PURE__ */ jsx(
          Link,
          {
            url: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav",
            target: "_blank",
            removeUnderline: true,
            children: "App nav best practices"
          }
        ) }) })
      ] }) }) })
    ] })
  ] });
}
function Code({ children }) {
  return /* @__PURE__ */ jsx(
    Box,
    {
      as: "span",
      padding: "025",
      paddingInlineStart: "100",
      paddingInlineEnd: "100",
      background: "bg-surface-active",
      borderWidth: "025",
      borderColor: "border",
      borderRadius: "100",
      children: /* @__PURE__ */ jsx("code", { children })
    }
  );
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: AdditionalPage
}, Symbol.toStringTag, { value: "Module" }));
async function loader$5({ request }) {
  console.log("🔍 Billing loader started");
  const { admin, session } = await authenticate.admin(request);
  console.log("✅ Billing auth success:", session.shop);
  const response = await admin.graphql(
    `#graphql
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          test
          trialDays
        }
      }
    }`
  );
  const data = await response.json();
  const subscription = data.data.currentAppInstallation.activeSubscriptions[0] || null;
  console.log("✅ Current subscription:", subscription);
  return json({ subscription, shop: session.shop });
}
async function action$3({ request }) {
  console.log("🚀 Billing action started");
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const planType = formData.get("plan");
  console.log("📋 Plan type:", planType);
  try {
    const createResponse = await admin.graphql(
      `#graphql
      mutation AppSubscriptionCreate(
        $name: String!
        $returnUrl: URL!
        $test: Boolean
        $trialDays: Int
        $lineItems: [AppSubscriptionLineItemInput!]!
      ) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          test: $test
          trialDays: $trialDays
          lineItems: $lineItems
        ) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appSubscription {
            id
            name
            status
            trialDays
          }
        }
      }`,
      {
        variables: {
          name: planType === "trial" ? "Premium Plan (7-Day Trial)" : "Premium Plan",
          returnUrl: `${process.env.SHOPIFY_APP_URL}/app`,
          test: true,
          trialDays: planType === "trial" ? 7 : 0,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: 10, currencyCode: "USD" },
                  interval: "EVERY_30_DAYS"
                }
              }
            }
          ]
        }
      }
    );
    const createData = await createResponse.json();
    if (createData.data.appSubscriptionCreate.userErrors.length > 0) {
      console.error("❌ Errors:", createData.data.appSubscriptionCreate.userErrors);
      return json({ errors: createData.data.appSubscriptionCreate.userErrors });
    }
    const confirmationUrl = createData.data.appSubscriptionCreate.confirmationUrl;
    console.log("✅ Subscription created:", createData.data.appSubscriptionCreate.appSubscription);
    console.log("✅ Confirmation URL:", confirmationUrl);
    return json({
      confirmationUrl,
      subscription: createData.data.appSubscriptionCreate.appSubscription
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return json({ error: error.message }, { status: 500 });
  }
}
function Billing() {
  const { subscription } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  useEffect(() => {
    if (actionData == null ? void 0 : actionData.confirmationUrl) {
      console.log("🔄 Redirecting to Shopify confirmation page:", actionData.confirmationUrl);
      window.open(actionData.confirmationUrl, "_top");
    }
  }, [actionData]);
  const handleSubscribe = (planType) => {
    console.log("🖱️ Button clicked:", planType);
    const formData = new FormData();
    formData.append("plan", planType);
    submit(formData, { method: "post" });
  };
  return /* @__PURE__ */ jsx(Page, { title: "Billing & Subscription", children: /* @__PURE__ */ jsx(Layout, { children: /* @__PURE__ */ jsxs(Layout.Section, { children: [
    (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx(Banner, { status: "critical", children: /* @__PURE__ */ jsxs("p", { children: [
      "Error: ",
      actionData.error
    ] }) }),
    (actionData == null ? void 0 : actionData.errors) && /* @__PURE__ */ jsx(Banner, { status: "critical", children: /* @__PURE__ */ jsxs("p", { children: [
      "Errors: ",
      actionData.errors.map((e) => e.message).join(", ")
    ] }) }),
    subscription ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs("div", { style: { padding: "1rem" }, children: [
      /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "✅ Active Subscription" }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: "1rem" }, children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Plan:" }),
          " ",
          subscription.name
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Status:" }),
          " ",
          subscription.status
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Test mode:" }),
          " ",
          subscription.test ? "Yes ✅" : "No"
        ] }),
        subscription.trialDays > 0 && /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Trial days:" }),
          " ",
          subscription.trialDays,
          " days 🎉"
        ] })
      ] })
    ] }) }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs("div", { style: { padding: "1rem" }, children: [
      /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "Subscribe to Premium Plan" }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: "1rem" }, children: [
        /* @__PURE__ */ jsx("p", { children: "Unlock premium features with our subscription" }),
        /* @__PURE__ */ jsx(Banner, { status: "info", style: { marginTop: "1rem" }, children: /* @__PURE__ */ jsxs("p", { children: [
          "💡 ",
          /* @__PURE__ */ jsx("strong", { children: "Dev Store Note:" }),
          " You'll be redirected to Shopify's confirmation page. On development stores, you may need to add a payment method in Settings → Billing to complete the subscription."
        ] }) }),
        /* @__PURE__ */ jsxs("div", { style: { marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              primary: true,
              loading: isLoading,
              onClick: () => handleSubscribe("trial"),
              children: "🎁 Start 7-Day Free Trial"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              loading: isLoading,
              onClick: () => handleSubscribe("paid"),
              children: "💳 Subscribe Now ($10/month)"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => window.open("/app/update-widget", "_blank"),
              children: "🔧 Force Update Widget"
            }
          )
        ] })
      ] })
    ] }) })
  ] }) }) });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: Billing,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const loader$4 = async ({ request }) => {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
  const { admin, billing, session } = await authenticate.admin(request);
  console.log("🔍 Проверка подписки в /app...");
  console.log("🏪 Shop:", session.shop);
  let hasSubscription = false;
  let subscription = null;
  let isDevStore = false;
  let planName = "Unknown";
  try {
    const shopResponse = await admin.graphql(
      `#graphql
      query {
        shop {
          plan {
            displayName
          }
        }
      }`
    );
    const shopData = await shopResponse.json();
    planName = ((_c = (_b = (_a2 = shopData.data) == null ? void 0 : _a2.shop) == null ? void 0 : _b.plan) == null ? void 0 : _c.displayName) || "Unknown";
    console.log("📊 Plan:", planName);
    isDevStore = planName.toLowerCase().includes("partner") || planName.toLowerCase().includes("development") || planName.toLowerCase().includes("trial") || planName.toLowerCase().includes("affiliate") || planName.toLowerCase().includes("app development");
    console.log("🔧 Is dev store:", isDevStore);
    if (!isDevStore) {
      const response2 = await admin.graphql(
        `#graphql
        query {
          currentAppInstallation {
            activeSubscriptions {
              id
              name
              status
              test
              trialDays
              currentPeriodEnd
            }
          }
        }`
      );
      const data = await response2.json();
      const subscriptions = ((_e = (_d = data.data) == null ? void 0 : _d.currentAppInstallation) == null ? void 0 : _e.activeSubscriptions) || [];
      hasSubscription = subscriptions.length > 0;
      subscription = subscriptions[0] || null;
      console.log("📊 Active subscriptions:", subscriptions);
      console.log("✅ Has subscription:", hasSubscription);
      if (subscription) {
        console.log("✅ Subscription status:", subscription.status);
        console.log("✅ Subscription test mode:", subscription.test);
        console.log("✅ Subscription trial days:", subscription.trialDays);
      }
    } else {
      console.log("✅ Dev store detected, skipping subscription check");
      hasSubscription = true;
    }
  } catch (err) {
    console.error("❌ Subscription check error:", err);
    isDevStore = true;
    hasSubscription = true;
    console.log("⚠️ Error occurred, assuming dev store for testing");
  }
  const response = await admin.graphql(
    `#graphql
    query {
      currentAppInstallation {
        metafields(first: 25, namespace: "sheet_pulse") {
          edges {
            node {
              key
              value
            }
          }
        }
      }
    }`
  );
  const resJson = await response.json();
  const fields = ((_h = (_g = (_f = resJson.data) == null ? void 0 : _f.currentAppInstallation) == null ? void 0 : _g.metafields) == null ? void 0 : _h.edges) || [];
  const qRaw = (_i = fields.find((f) => f.node.key === "q_json")) == null ? void 0 : _i.node.value;
  console.log("📋 Found metafields:", fields.map((f) => ({ key: f.node.key, value: f.node.value })));
  return json({
    questions: qRaw ? JSON.parse(qRaw) : [{ id: Date.now(), type: "emoji", label: "How was your experience?" }],
    gUrl: ((_j = fields.find((f) => f.node.key === "g_url")) == null ? void 0 : _j.node.value) || "",
    tType: ((_k = fields.find((f) => f.node.key === "t_type")) == null ? void 0 : _k.node.value) || "timer",
    tVal: ((_l = fields.find((f) => f.node.key === "t_val")) == null ? void 0 : _l.node.value) || "3",
    tDev: ((_m = fields.find((f) => f.node.key === "t_dev")) == null ? void 0 : _m.node.value) || "all",
    aCol: ((_n = fields.find((f) => f.node.key === "a_col")) == null ? void 0 : _n.node.value) || "#008060",
    lang: ((_o = fields.find((f) => f.node.key === "lang")) == null ? void 0 : _o.node.value) || "en",
    status: ((_p = fields.find((f) => f.node.key === "status")) == null ? void 0 : _p.node.value) || "active",
    widgetPosition: ((_q = fields.find((f) => f.node.key === "w_pos")) == null ? void 0 : _q.node.value) || "right",
    surveyVersion: ((_r = fields.find((f) => f.node.key === "survey_version")) == null ? void 0 : _r.node.value) || "",
    shop: session.shop,
    billingStatus: { hasPayment: hasSubscription, isTrial: false },
    requiresAuth: false,
    hasSubscription,
    // Добавляем флаг для клиентского редиректа
    subscription,
    // Добавляем полную информацию о подписке
    isDevStore,
    // Флаг dev store
    planName,
    // Название плана
    allMetafields: fields.map((f) => ({ key: f.node.key, value: f.node.value }))
    // Все метаполя для отладки
  });
};
const action$2 = async ({ request }) => {
  var _a2;
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "reset_survey") {
    try {
      const appRes = await admin.graphql(`{currentAppInstallation{id}}`);
      const appResData = await appRes.json();
      if (appResData.errors) {
        throw new Error(`App installation query failed: ${JSON.stringify(appResData.errors)}`);
      }
      const appId = appResData.data.currentAppInstallation.id;
      const newVersion = String(Date.now());
      const result = await admin.graphql(
        `mutation reset($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){metafields{key}}}`,
        {
          variables: {
            m: [
              {
                namespace: "sheet_pulse",
                key: "survey_version",
                type: "single_line_text_field",
                value: newVersion,
                ownerId: appId
              }
            ]
          }
        }
      );
      const resultData = await result.json();
      if (resultData.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(resultData.errors)}`);
      }
      return json({ resetOk: true, surveyVersion: newVersion });
    } catch (e) {
      console.error("❌ Reset survey error:", e);
      return json({ resetOk: false, error: e.message }, { status: 500 });
    }
  }
  if (intent === "test_connection") {
    try {
      const res = await fetch(formData.get("gurl"), {
        method: "POST",
        body: JSON.stringify({ respondentId: "TEST", device: "Desktop", lang: "en", answer: { "Connection Test": "Success 🚀" }, pageUrl: "Admin" })
      });
      return json({ testOk: res.ok });
    } catch (e) {
      return json({ testOk: false });
    }
  }
  try {
    console.log("🔧 Starting action handler");
    const appRes = await admin.graphql(`{currentAppInstallation{id}}`);
    const appResData = await appRes.json();
    console.log("📋 App installation response:", appResData);
    if (appResData.errors) {
      console.error("❌ App installation query errors:", appResData.errors);
      throw new Error(`App installation query failed: ${JSON.stringify(appResData.errors)}`);
    }
    const appId = appResData.data.currentAppInstallation.id;
    console.log("✅ Got app ID:", appId);
    const data = Object.fromEntries(formData);
    console.log("📝 Full form data:", data);
    if (!data.q) {
      throw new Error("Questions data is missing");
    }
    let questions;
    try {
      questions = JSON.parse(data.q);
      console.log("✅ Parsed questions:", questions);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Questions must be a non-empty array");
      }
    } catch (e) {
      console.error("❌ Failed to parse questions:", e, "Raw data:", data.q);
      throw new Error(`Invalid questions format: ${e.message}`);
    }
    const m = [
      { namespace: "sheet_pulse", key: "q_json", type: "json", value: data.q, ownerId: appId },
      { namespace: "sheet_pulse", key: "g_url", type: "single_line_text_field", value: data.gurl || "", ownerId: appId },
      { namespace: "sheet_pulse", key: "t_type", type: "single_line_text_field", value: data.ttype || "timer", ownerId: appId },
      { namespace: "sheet_pulse", key: "t_val", type: "single_line_text_field", value: data.tval || "3", ownerId: appId },
      { namespace: "sheet_pulse", key: "t_dev", type: "single_line_text_field", value: data.tdev || "all", ownerId: appId },
      { namespace: "sheet_pulse", key: "a_col", type: "single_line_text_field", value: data.acol || "#008060", ownerId: appId },
      { namespace: "sheet_pulse", key: "lang", type: "single_line_text_field", value: data.lang || "en", ownerId: appId },
      { namespace: "sheet_pulse", key: "status", type: "single_line_text_field", value: data.status || "active", ownerId: appId },
      { namespace: "sheet_pulse", key: "w_pos", type: "single_line_text_field", value: data.wpos || "right", ownerId: appId },
      { namespace: "sheet_pulse", key: "survey_version", type: "single_line_text_field", value: String(((_a2 = questions[0]) == null ? void 0 : _a2.id) || Date.now()), ownerId: appId }
    ];
    console.log("📤 Sending metafields:", m);
    const result = await admin.graphql(`mutation save($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){metafields{key}}}`, { variables: { m } });
    const resultData = await result.json();
    console.log("✅ Metafields update result:", resultData);
    if (resultData.errors) {
      console.error("❌ GraphQL errors:", resultData.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(resultData.errors)}`);
    }
    return json({ saved: true });
  } catch (error) {
    console.error("❌ Action error:", error);
    console.error("❌ Stack trace:", error.stack);
    return json(
      { error: error.message, details: error.toString() },
      { status: 500 }
    );
  }
};
function Preview({ questions, color, lang }) {
  var _a2;
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState([]);
  const [textVal, setTextVal] = useState("");
  const [otherVal, setOtherVal] = useState("");
  const q = questions[step];
  useEffect(() => {
    setSelected([]);
    setTextVal("");
    setOtherVal("");
  }, [step, questions]);
  const canNext = (() => {
    if (!q) return false;
    if (q.type === "text" && textVal.trim().length > 0) return true;
    if (q.type !== "text" && selected.length > 0) return true;
    if ((q.type === "radio" || q.type === "checkbox") && otherVal.trim().length > 0) return true;
    if (selected.includes("Skip")) return true;
    return false;
  })();
  const handleSelect = (val) => {
    if (val === "Skip") {
      handleNext();
      return;
    }
    if (q.type === "checkbox") {
      if (selected.includes(val)) setSelected(selected.filter((i) => i !== val));
      else setSelected([...selected, val]);
    } else {
      setSelected([val]);
      if (q.type === "radio") setOtherVal("");
    }
  };
  const handleOtherChange = (val) => {
    setOtherVal(val);
    if (val.trim().length > 0) setSelected([]);
  };
  const handleNext = () => {
    if (step < questions.length - 1) setStep(step + 1);
    else setDone(true);
  };
  const i18n = {
    en: { next: "Next", finish: "Finish", thanks: "Thank you! 🚀", skip: "Not sure", other: "Other..." },
    es: { next: "Siguiente", finish: "Finalizar", thanks: "¡Gracias! 🚀", skip: "No lo sé", other: "Otro..." },
    de: { next: "Weiter", finish: "Beenden", thanks: "Danke! 🚀", skip: "Nicht sicher", other: "Anderes..." },
    fr: { next: "Suivant", finish: "Terminer", thanks: "Merci! 🚀", skip: "Pas sûr", other: "Autre..." },
    pt: { next: "Próximo", finish: "Finalizar", thanks: "Obrigado! 🚀", skip: "Não sei", other: "Outro..." }
  }[lang] || { next: "Next", finish: "Finish", thanks: "Thank you! 🚀", skip: "Not sure", other: "Other..." };
  const cleanColor = color && color.trim() ? color.replace(/^#/, "") : "000000";
  const themeColor = "#" + cleanColor;
  const isWhite = themeColor.toLowerCase() === "#ffffff" || themeColor.toLowerCase() === "#fff";
  const isBlack = themeColor.toLowerCase() === "#000000" || themeColor.toLowerCase() === "#000" || cleanColor === "111" || parseInt(cleanColor, 16) < 3355443;
  const btnTxt = "#ffffff";
  const btnBorder = isWhite ? "1px solid #ccc" : "none";
  const selectedBg = isBlack ? "#333333" : themeColor;
  const btnStyle = { padding: "12px", border: "1px solid #eee", borderRadius: "12px", background: "#fff", cursor: "pointer", fontSize: "14px", textAlign: "left", display: "flex", alignItems: "center", width: "100%", marginBottom: "8px", transition: "0.15s", boxSizing: "border-box", color: "#333" };
  const activeStyle = { ...btnStyle, backgroundColor: selectedBg, color: btnTxt };
  if (done) return /* @__PURE__ */ jsxs("div", { style: { padding: "40px", background: "#fff", borderRadius: "18px", boxShadow: "0 12px 50px rgba(0,0,0,0.15)", border: "1px solid #f0f0f0", width: "350px", margin: "0 auto", textAlign: "center" }, children: [
    /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: i18n.thanks }),
    /* @__PURE__ */ jsx(Box, { paddingBlockStart: "400", children: /* @__PURE__ */ jsx(Button, { onClick: () => {
      setStep(0);
      setDone(false);
    }, children: "Reset Preview" }) })
  ] });
  const isEmoji5 = (q == null ? void 0 : q.type) === "emoji5";
  const renderScaleButtons = () => {
    const max = parseInt(q.scaleMax || 5);
    return Array.from({ length: max }, (_, i) => {
      const isSelected = selected.includes(i + 1);
      return /* @__PURE__ */ jsx("button", { onClick: () => handleSelect(i + 1), style: { padding: "14px 0", border: "1px solid #eee", borderRadius: "8px", background: isSelected ? selectedBg : "#fff", color: isSelected ? btnTxt : "#333", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "0.15s" }, children: i + 1 }, i);
    });
  };
  return /* @__PURE__ */ jsxs("div", { style: { padding: "20px", background: "#fff", borderRadius: "18px", boxShadow: "0 12px 50px rgba(0,0,0,0.15)", border: "1px solid #f0f0f0", width: "350px", margin: "0 auto", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px" }, children: [
      /* @__PURE__ */ jsxs("span", { style: { fontSize: "9px", fontWeight: "800", color: themeColor, textTransform: "uppercase" }, children: [
        "STEP ",
        step + 1,
        "/",
        questions.length
      ] }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: "22px", color: "#bbb", lineHeight: "0.5", cursor: "pointer" }, children: "×" })
    ] }),
    /* @__PURE__ */ jsx("p", { style: { fontWeight: "700", marginBottom: "15px", fontSize: "16px", color: "#111", lineHeight: "1.4" }, children: q == null ? void 0 : q.label }),
    /* @__PURE__ */ jsxs(Box, { minHeight: "120px", children: [
      (q == null ? void 0 : q.type.includes("emoji")) && /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: isEmoji5 ? "space-between" : "space-around", gap: isEmoji5 ? "2px" : "5px", width: "100%", boxSizing: "border-box", marginBottom: "10px" }, children: (q.type === "emoji" ? ["😞", "😐", "🤩"] : ["😡", "😟", "😐", "🙂", "😍"]).map((e) => /* @__PURE__ */ jsx("button", { onClick: () => handleSelect(e), style: { fontSize: isEmoji5 ? "32px" : "42px", border: "none", background: "transparent", cursor: "pointer", transform: selected.includes(e) ? isEmoji5 ? "scale(1.15)" : "scale(1.2)" : "scale(1)", transition: "0.15s", flexShrink: 0, padding: "0", lineHeight: 1 }, children: e }, e)) }),
      ((q == null ? void 0 : q.type) === "radio" || (q == null ? void 0 : q.type) === "checkbox") && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [
        (_a2 = q.options) == null ? void 0 : _a2.split(",").map((o) => o.trim()).map((o) => {
          const isSelected = selected.includes(o);
          return /* @__PURE__ */ jsxs("button", { onClick: () => handleSelect(o), style: isSelected ? activeStyle : btnStyle, children: [
            q.type === "checkbox" && /* @__PURE__ */ jsx("span", { style: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", border: "2px solid " + (isSelected ? isBlack ? "#333" : themeColor : "#ddd"), marginRight: "10px", borderRadius: "4px", flexShrink: 0, verticalAlign: "middle", transition: "0.15s", backgroundColor: isSelected ? isBlack ? "#333" : themeColor : "transparent" }, children: /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", fontWeight: "bold", color: "#fff", opacity: isSelected ? 1 : 0, transition: "0.15s" }, children: "✓" }) }),
            o
          ] }, o);
        }),
        (q.hasOther || q.notSure) && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }, children: [
          q.hasOther && /* @__PURE__ */ jsx("input", { type: "text", placeholder: i18n.other, value: otherVal, onChange: (e) => handleOtherChange(e.target.value), style: { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #eee", boxSizing: "border-box", fontSize: "13px" } }),
          q.notSure && /* @__PURE__ */ jsx("button", { onClick: () => handleSelect("Skip"), style: { ...btnStyle, border: "1px dashed #ddd", color: "#666", textAlign: "center", justifyContent: "center", marginTop: 0 }, children: i18n.skip })
        ] })
      ] }),
      (q == null ? void 0 : q.type) === "scale" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(" + (q.scaleMax || 5) + ", 1fr)", gap: "5px" }, children: renderScaleButtons() }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999", marginTop: "8px" }, children: [
          /* @__PURE__ */ jsx("span", { children: q.labelL }),
          /* @__PURE__ */ jsx("span", { children: q.labelR })
        ] })
      ] }),
      (q == null ? void 0 : q.type) === "text" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("textarea", { placeholder: q.placeholder || "...", value: textVal, onChange: (e) => setTextVal(e.target.value), style: { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #eee", minHeight: "70px", boxSizing: "border-box", fontSize: "14px", fontFamily: "inherit" } }),
        q.notSure && /* @__PURE__ */ jsx("button", { onClick: () => handleSelect("Skip"), style: { ...btnStyle, border: "1px dashed #ddd", color: "#666", textAlign: "center", justifyContent: "center", marginTop: "8px" }, children: i18n.skip })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: "20px" }, children: /* @__PURE__ */ jsx("button", { onClick: () => canNext && handleNext(), disabled: !canNext, style: { width: "100%", background: themeColor, color: btnTxt, border: btnBorder, padding: "14px", borderRadius: "12px", fontWeight: "700", fontSize: "15px", cursor: canNext ? "pointer" : "default", opacity: canNext ? 1 : 0, transition: "opacity 0.3s, background 0.3s", boxShadow: canNext ? "0 2px 5px rgba(0,0,0,0.1)" : "none", display: canNext ? "block" : "none" }, children: step === questions.length - 1 ? i18n.finish : i18n.next }) })
  ] });
}
function Index() {
  const settings = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const nav = useNavigation();
  useNavigate();
  const [questions, setQuestions] = useState(settings.questions);
  const [aCol, setACol] = useState(settings.aCol);
  const [gUrl, setGUrl] = useState(settings.gUrl);
  const [status, setStatus] = useState(settings.status);
  const [tType, setTType] = useState(settings.tType);
  const [tVal, setTVal] = useState(settings.tVal);
  const [tDev, setTDev] = useState(settings.tDev);
  const [lang, setLang] = useState(settings.lang);
  const [wPos, setWPos] = useState(settings.widgetPosition);
  useEffect(() => {
    if (actionData == null ? void 0 : actionData.resetOk) {
      alert("Survey has been reset! All visitors can now take the survey again.");
    } else if ((actionData == null ? void 0 : actionData.resetOk) === false) {
      alert(`Reset failed: ${(actionData == null ? void 0 : actionData.error) || "Unknown error"}`);
    }
  }, [actionData == null ? void 0 : actionData.resetOk, actionData == null ? void 0 : actionData.error]);
  const move = (idx, dir) => {
    const newQ = [...questions];
    const [item] = newQ.splice(idx, 1);
    newQ.splice(idx + dir, 0, item);
    setQuestions(newQ);
  };
  const save = (s) => submit({ q: JSON.stringify(questions), gurl: gUrl, ttype: tType, tval: tVal, tdev: tDev, acol: aCol, lang, status: s || status, wpos: wPos }, { method: "POST" });
  const bridgeCode = `function doPost(e) { try { var ss = SpreadsheetApp.getActiveSpreadsheet(); var sheet = ss.getSheets()[0]; var postData = e.postData.contents; if (!postData) return ContentService.createTextOutput(JSON.stringify({"error": "No data"})).setMimeType(ContentService.MimeType.JSON); var data = JSON.parse(postData); var answers = data.answer; if (typeof answers === 'string') { try { answers = JSON.parse(answers); } catch(e) { answers = {"Answer": answers }; } } if (sheet.getLastRow() === 0) { var headers = ["Date", "Respondent ID", "Device", "Language", "Page URL"]; Object.keys(answers || {}).forEach(k => headers.push(k)); sheet.appendRow(headers); sheet.getRange(1,1,1,headers.length).setFontWeight("bold").setBackground("#f4f4f4"); } var row = [new Date(), data.respondentId||"Unknown", data.device||"Unknown", data.lang||"en", data.pageUrl||"Unknown"]; var h = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]; for(var i=5;i<h.length;i++) row.push(answers?.[h[i]] || "-"); sheet.appendRow(row); return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON); } catch(e) { return ContentService.createTextOutput(JSON.stringify({"error":e.toString()})).setMimeType(ContentService.MimeType.JSON); } }`;
  return /* @__PURE__ */ jsxs(Page, { title: "SheetPulse: Professional Survey Builder", children: [
    /* @__PURE__ */ jsxs(Layout, { children: [
      /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
        settings.isDevStore && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { variant: "headingMd", children: "🔧 Development Mode" }),
          /* @__PURE__ */ jsxs(Banner, { status: "info", children: [
            /* @__PURE__ */ jsx("p", { children: "This is a development store. Subscription check is disabled for testing purposes." }),
            /* @__PURE__ */ jsxs("p", { children: [
              "Plan: ",
              settings.planName
            ] })
          ] })
        ] }) }),
        settings.subscription && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { variant: "headingMd", children: "✅ Active Subscription" }),
          /* @__PURE__ */ jsxs("div", { style: { marginTop: "1rem" }, children: [
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Plan:" }),
              " ",
              settings.subscription.name
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Status:" }),
              " ",
              settings.subscription.status
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Test mode:" }),
              " ",
              settings.subscription.test ? "Yes" : "No"
            ] }),
            settings.subscription.trialDays > 0 && /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Trial days:" }),
              " ",
              settings.subscription.trialDays,
              " days 🎉"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { variant: "headingMd", children: "1. Connect Google Sheets" }),
          /* @__PURE__ */ jsxs(List, { type: "number", children: [
            /* @__PURE__ */ jsx(List.Item, { children: "Create a new Google Sheet. Open it." }),
            /* @__PURE__ */ jsxs(List.Item, { children: [
              "In the top menu, go to ",
              /* @__PURE__ */ jsx("b", { children: "Extensions → Apps Script" }),
              "."
            ] }),
            /* @__PURE__ */ jsxs(List.Item, { children: [
              "Delete any existing code and ",
              /* @__PURE__ */ jsx("b", { children: "Paste the Bridge Code" }),
              " (find it in the right sidebar)."
            ] }),
            /* @__PURE__ */ jsxs(List.Item, { children: [
              "Click ",
              /* @__PURE__ */ jsx("b", { children: "Deploy → New Deployment" }),
              ". Select type: ",
              /* @__PURE__ */ jsx("b", { children: "Web App" }),
              "."
            ] }),
            /* @__PURE__ */ jsxs(List.Item, { children: [
              'Set "Execute as: ',
              /* @__PURE__ */ jsx("b", { children: "Me" }),
              '" and "Who has access: ',
              /* @__PURE__ */ jsx("b", { children: "Anyone" }),
              '".'
            ] }),
            /* @__PURE__ */ jsxs(List.Item, { children: [
              "Click Deploy, Authorize access, and ",
              /* @__PURE__ */ jsx("b", { children: "Copy the Web App URL" }),
              "."
            ] })
          ] }),
          /* @__PURE__ */ jsx(Divider, {}),
          /* @__PURE__ */ jsx(TextField, { label: "Paste your Web App URL here", value: gUrl, onChange: setGUrl, placeholder: "https://script.google.com/macros/s/.../exec" }),
          /* @__PURE__ */ jsxs(InlineStack, { gap: "300", children: [
            /* @__PURE__ */ jsx(Button, { onClick: () => submit({ intent: "test_connection", gurl: gUrl }, { method: "POST" }), loading: nav.state === "submitting", children: "Test Connection" }),
            (actionData == null ? void 0 : actionData.testOk) && /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Success!" }),
            (actionData == null ? void 0 : actionData.testOk) === false && /* @__PURE__ */ jsx(Badge, { tone: "critical", children: "Failed" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsxs(Text, { variant: "headingMd", children: [
            "Survey Status: ",
            /* @__PURE__ */ jsx(Badge, { tone: status === "active" ? "success" : "attention", children: status.toUpperCase() })
          ] }),
          /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
            /* @__PURE__ */ jsx(Button, { onClick: () => {
              setStatus("stopped");
              save("stopped");
            }, disabled: status === "stopped", children: "Stop Survey" }),
            /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => {
              setStatus("active");
              save("active");
            }, disabled: status === "active", children: "Launch on Site" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { variant: "headingMd", children: "🔄 Reset Survey" }),
          /* @__PURE__ */ jsx(Text, { tone: "subdued", children: 'Reset the survey to allow users to take it again. This will clear the "already completed" status for all visitors.' }),
          /* @__PURE__ */ jsx(Button, { variant: "primary", onClick: () => {
            if (confirm("Are you sure you want to reset the survey? This will allow all visitors to take it again.")) {
              submit({ intent: "reset_survey" }, { method: "POST" });
            }
          }, children: "Reset Survey" })
        ] }) }),
        questions.map((q, idx) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
            /* @__PURE__ */ jsxs(InlineStack, { gap: "200", children: [
              /* @__PURE__ */ jsxs(Text, { variant: "headingSm", children: [
                "Step ",
                idx + 1
              ] }),
              /* @__PURE__ */ jsx(Button, { onClick: () => move(idx, -1), disabled: idx === 0, plain: true, children: "↑" }),
              /* @__PURE__ */ jsx(Button, { onClick: () => move(idx, 1), disabled: idx === questions.length - 1, plain: true, children: "↓" })
            ] }),
            /* @__PURE__ */ jsx(Button, { tone: "critical", onClick: () => setQuestions(questions.filter((x) => x.id !== q.id)), variant: "plain", children: "Remove" })
          ] }),
          /* @__PURE__ */ jsx(TextField, { label: "Question", value: q.label, onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, label: v } : x)), autoComplete: "off" }),
          /* @__PURE__ */ jsx(Select, { label: "Type", options: [{ label: "Emoji (3 faces)", value: "emoji" }, { label: "Emoji (5 faces)", value: "emoji5" }, { label: "Single Choice", value: "radio" }, { label: "Multiple Choice", value: "checkbox" }, { label: "Rating Scale", value: "scale" }, { label: "Open Text", value: "text" }], value: q.type, onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, type: v } : x)) }),
          q.type === "scale" && /* @__PURE__ */ jsxs(InlineStack, { gap: "400", children: [
            /* @__PURE__ */ jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ jsx(Select, { label: "Max", options: ["5", "7", "10"].map((v) => ({ label: v, value: v })), value: q.scaleMax || "5", onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, scaleMax: v } : x)) }) }),
            /* @__PURE__ */ jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ jsx(TextField, { label: "Min Label", value: q.labelL, onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, labelL: v } : x)), placeholder: "Poor" }) }),
            /* @__PURE__ */ jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ jsx(TextField, { label: "Max Label", value: q.labelR, onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, labelR: v } : x)), placeholder: "Excellent" }) })
          ] }),
          (q.type === "radio" || q.type === "checkbox") && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(TextField, { label: "Options (comma separated)", value: q.options, onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, options: v } : x)) }),
            /* @__PURE__ */ jsx(Checkbox, { label: "Add 'Other' with input", checked: q.hasOther, onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, hasOther: v } : x)) })
          ] }),
          q.type === "text" && /* @__PURE__ */ jsx(TextField, { label: "Input Placeholder", value: q.placeholder, onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, placeholder: v } : x)), placeholder: "e.g. Tell us more..." }),
          /* @__PURE__ */ jsx(Checkbox, { label: "Allow 'Not sure' / Skip", checked: q.notSure, onChange: (v) => setQuestions(questions.map((x) => x.id === q.id ? { ...x, notSure: v } : x)) })
        ] }) }, q.id)),
        /* @__PURE__ */ jsx(Button, { onClick: () => setQuestions([...questions, { id: Date.now(), type: "emoji", label: "New Question" }]), children: "Add Survey Step" }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", align: "center", children: [
          /* @__PURE__ */ jsx(Text, { variant: "headingMd", as: "h2", children: "📱 Live Preview" }),
          /* @__PURE__ */ jsx("div", { style: { background: "#f4f6f8", padding: "30px", borderRadius: "12px", width: "100%", boxSizing: "border-box" }, children: /* @__PURE__ */ jsx(Preview, { questions, color: aCol, lang }) }),
          /* @__PURE__ */ jsxs(InlineStack, { gap: "300", align: "center", children: [
            /* @__PURE__ */ jsx(TextField, { label: "Accent Color", value: aCol, onChange: setACol, prefix: "#", style: { width: "120px" } }),
            /* @__PURE__ */ jsx(Select, { label: "Position", options: [{ label: "Right", value: "right" }, { label: "Left", value: "left" }], value: wPos, onChange: setWPos, style: { width: "120px" } })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Divider, {}),
        /* @__PURE__ */ jsxs(InlineStack, { align: "space-between", children: [
          /* @__PURE__ */ jsx(Text, { tone: "subdued", children: "Settings sync automatically when you click Sync." }),
          /* @__PURE__ */ jsx(Button, { variant: "primary", size: "large", onClick: () => save(), loading: nav.state === "submitting", children: "Sync & Save All" })
        ] }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { variant: "headingMd", children: "⚠️ Important: Google Sheets Data" }),
          /* @__PURE__ */ jsxs(Text, { tone: "subdued", children: [
            /* @__PURE__ */ jsx("b", { children: "If you change question order, question text, or question types" }),
            " (e.g., from emoji to text), the data in your Google Sheet may no longer match the new structure."
          ] }),
          /* @__PURE__ */ jsx(Text, { tone: "subdued", children: /* @__PURE__ */ jsx("b", { children: "Options:" }) }),
          /* @__PURE__ */ jsxs(List, { children: [
            /* @__PURE__ */ jsx(List.Item, { children: "Create a new Google Sheet and update the Web App URL" }),
            /* @__PURE__ */ jsx(List.Item, { children: "Or manually adjust your existing sheet headers to match new questions" })
          ] })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
        /* @__PURE__ */ jsx(Card, { title: "Triggers & Language", children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Select, { label: "Display Language", options: [{ label: "English", value: "en" }, { label: "Spanish", value: "es" }, { label: "German", value: "de" }, { label: "French", value: "fr" }, { label: "Portuguese", value: "pt" }], value: lang, onChange: setLang }),
          /* @__PURE__ */ jsx(Select, { label: "Target Device", options: [{ label: "All Devices", value: "all" }, { label: "Desktop Only", value: "desktop" }, { label: "Mobile Only", value: "mobile" }], value: tDev, onChange: setTDev }),
          /* @__PURE__ */ jsx(Select, { label: "Trigger Event", options: [{ label: "Timer", value: "timer" }, { label: "Exit Intent", value: "exit" }, { label: "Cart Item Count", value: "cart" }, { label: "Purchase (Thank you)", value: "purchase" }], value: tType, onChange: setTType }),
          (tType === "timer" || tType === "cart") && /* @__PURE__ */ jsx(TextField, { label: tType === "timer" ? "Wait time (seconds)" : "Item Count", type: "number", value: tVal, onChange: setTVal })
        ] }) }),
        /* @__PURE__ */ jsxs(Card, { title: "Copy Bridge Code", children: [
          /* @__PURE__ */ jsx("textarea", { readOnly: true, style: { width: "100%", height: "150px", fontSize: "10px", fontFamily: "monospace", padding: "8px", background: "#f4f4f4", border: "1px solid #ddd" }, value: bridgeCode }),
          /* @__PURE__ */ jsx(Box, { paddingBlockStart: "200", children: /* @__PURE__ */ jsx(Button, { fullWidth: true, onClick: () => {
            navigator.clipboard.writeText(bridgeCode);
            alert("Copied!");
          }, children: "Copy Code" }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Box, { paddingBlockEnd: "1000" })
  ] });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: Index,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3({ request }) {
  try {
    await authenticate.admin(request);
    return redirect("/app");
  } catch (e) {
    return new Response("Please open the app from Shopify Admin", { status: 200 });
  }
}
async function action$1({ request }) {
  return loader$3({ request });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const action = async ({ request }) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);
    return new Response();
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 500 });
  }
};
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({ request }) => {
  await authenticate.admin(request);
  return redirect("/app/billing");
};
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const index = "_index_1hqgz_1";
const heading = "_heading_1hqgz_21";
const text = "_text_1hqgz_23";
const content = "_content_1hqgz_43";
const form = "_form_1hqgz_53";
const label = "_label_1hqgz_69";
const input = "_input_1hqgz_85";
const button = "_button_1hqgz_93";
const list = "_list_1hqgz_101";
const styles = {
  index,
  heading,
  text,
  content,
  form,
  label,
  input,
  button,
  list
};
const loader$1 = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
};
function App$1() {
  const { showForm } = useLoaderData();
  return /* @__PURE__ */ jsx("div", { className: styles.index, children: /* @__PURE__ */ jsxs("div", { className: styles.content, children: [
    /* @__PURE__ */ jsx("h1", { className: styles.heading, children: "A short heading about [your app]" }),
    /* @__PURE__ */ jsx("p", { className: styles.text, children: "A tagline about [your app] that describes your value proposition." }),
    showForm && /* @__PURE__ */ jsxs(Form, { className: styles.form, method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ jsxs("label", { className: styles.label, children: [
        /* @__PURE__ */ jsx("span", { children: "Shop domain" }),
        /* @__PURE__ */ jsx("input", { className: styles.input, type: "text", name: "shop" }),
        /* @__PURE__ */ jsx("span", { children: "e.g: my-shop-domain.myshopify.com" })
      ] }),
      /* @__PURE__ */ jsx("button", { className: styles.button, type: "submit", children: "Log in" })
    ] }),
    /* @__PURE__ */ jsxs("ul", { className: styles.list, children: [
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] })
    ] })
  ] }) });
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App$1,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const loader = async ({ request }) => {
  try {
    console.log("🔍 Проверка аутентификации в /app...");
    await authenticate.admin(request);
    console.log("✅ Аутентификация успешна в /app");
    return {};
  } catch (error) {
    console.log("⚠️ Auth error in /app:", error.message);
    throw error;
  }
};
function App() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("nav", { style: { padding: "10px", background: "#f6f6f7", borderBottom: "1px solid #e1e3e5" }, children: [
      /* @__PURE__ */ jsx(Link$1, { to: "/app", style: { marginRight: "15px" }, children: "Home" }),
      /* @__PURE__ */ jsx(Link$1, { to: "/app/billing", style: { marginRight: "15px" }, children: "Billing" }),
      /* @__PURE__ */ jsx(Link$1, { to: "/app/additional", children: "Additional" })
    ] }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
function ErrorBoundary() {
  return boundary.error(useRouteError());
}
const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: App,
  headers,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-wCjTaVpJ.js", "imports": ["/assets/index-D_tlrhbj.js", "/assets/components-DUbI-c2K.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-vrHWCBfj.js", "imports": ["/assets/index-D_tlrhbj.js", "/assets/components-DUbI-c2K.js", "/assets/context-BtFpjLXj.js"], "css": [] }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "routes/webhooks", "path": "app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "routes/webhooks", "path": "app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.survey-config": { "id": "routes/api.survey-config", "parentId": "root", "path": "api/survey-config", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.survey-config-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app.update-widget": { "id": "routes/app.update-widget", "parentId": "routes/app", "path": "update-widget", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.update-widget-wEmS5qgJ.js", "imports": ["/assets/index-D_tlrhbj.js", "/assets/components-DUbI-c2K.js", "/assets/Page-sGWpAvE5.js", "/assets/context-BtFpjLXj.js"], "css": [] }, "routes/app.additional": { "id": "routes/app.additional", "parentId": "routes/app", "path": "additional", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.additional-B2GSGZbL.js", "imports": ["/assets/index-D_tlrhbj.js", "/assets/Page-sGWpAvE5.js", "/assets/Layout-iBM0MLdJ.js", "/assets/List-C3pYEl_4.js", "/assets/context-BtFpjLXj.js"], "css": [] }, "routes/app.billing": { "id": "routes/app.billing", "parentId": "routes/app", "path": "billing", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.billing-CHu7qXbl.js", "imports": ["/assets/index-D_tlrhbj.js", "/assets/components-DUbI-c2K.js", "/assets/Page-sGWpAvE5.js", "/assets/Layout-iBM0MLdJ.js", "/assets/Banner-Ckykmpqu.js", "/assets/context-BtFpjLXj.js"], "css": [] }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-BgEQY5Au.js", "imports": ["/assets/index-D_tlrhbj.js", "/assets/components-DUbI-c2K.js", "/assets/Page-sGWpAvE5.js", "/assets/Layout-iBM0MLdJ.js", "/assets/Banner-Ckykmpqu.js", "/assets/List-C3pYEl_4.js", "/assets/context-BtFpjLXj.js"], "css": [] }, "routes/auth.login": { "id": "routes/auth.login", "parentId": "root", "path": "auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth.login-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/webhooks": { "id": "routes/webhooks", "parentId": "root", "path": "webhooks", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/webhooks-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/route-C8Qr3-sj.js", "imports": ["/assets/index-D_tlrhbj.js", "/assets/components-DUbI-c2K.js"], "css": ["/assets/route-CNPfFM0M.css"] }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/app-DwmTdf0Z.js", "imports": ["/assets/index-D_tlrhbj.js", "/assets/components-DUbI-c2K.js"], "css": [] } }, "url": "/assets/manifest-9f05b303.js", "version": "9f05b303" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "routes/webhooks",
    path: "app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "routes/webhooks",
    path: "app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/api.survey-config": {
    id: "routes/api.survey-config",
    parentId: "root",
    path: "api/survey-config",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/app.update-widget": {
    id: "routes/app.update-widget",
    parentId: "routes/app",
    path: "update-widget",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/app.billing": {
    id: "routes/app.billing",
    parentId: "routes/app",
    path: "billing",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route7
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/webhooks": {
    id: "routes/webhooks",
    parentId: "root",
    path: "webhooks",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route11
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};

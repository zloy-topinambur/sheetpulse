import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export const loader = async ({ request }) => {
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "89faf3e331fad9beb46658573ca89bcc",
  });
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="shopify-api-key" content={apiKey} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <Meta />
        <Links />
        {/* Widget Script Tag */}
        <script>
          {`
            window.SheetPulse = {
              questions: [],
              googleUrl: "",
              triggerType: "timer",
              tVal: "3",
              targetDevice: "all",
              accentColor: "#000000",
              lang: "en",
              status: "active",
              surveyVersion: "",
              widgetPosition: "right"
            };
            console.log("✅ SheetPulse initialized:", window.SheetPulse);
          `}
        </script>
        <link rel="stylesheet" href="/widget/widget.css?v={{ 'now' | date: '%s' }}" />
        <script src="/widget/widget.js?v={{ 'now' | date: '%s' }}" defer></script>
      </head>
      <body>
        <AppProvider isEmbeddedApp apiKey={apiKey}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { Link, Outlet, useLoaderData, useRouteError, redirect } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    console.log("🔍 Проверка аутентификации в /app...");
    const { admin } = await authenticate.admin(request);
    console.log("✅ Аутентификация успешна в /app");

    // Проверка активной подписки
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
            currentPeriodEnd
          }
        }
      }`
    );

    const data = await response.json();
    const subscription = data.data.currentAppInstallation.activeSubscriptions[0] || null;

    // Если нет активной подписки или trial истек, перенаправить на биллинг
    if (!subscription || (subscription.status !== 'ACTIVE' && subscription.trialDays <= 0)) {
      console.log("⚠️ Нет активной подписки, перенаправляем на /app/billing");
      return redirect("/app/billing");
    }

    console.log("✅ Подписка активна:", subscription.status);
    return { subscription };
  } catch (error) {
    console.log("⚠️ Auth error in /app:", error.message);
    throw error;
  }
};

export default function App() {
  return (
    <>
      <nav style={{ padding: '10px', background: '#f6f6f7', borderBottom: '1px solid #e1e3e5' }}>
        <Link to="/app" style={{ marginRight: '15px' }}>Home</Link>
        <Link to="/app/billing" style={{ marginRight: '15px' }}>Billing</Link>
        <Link to="/app/additional">Additional</Link>
      </nav>
      <Outlet />
    </>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

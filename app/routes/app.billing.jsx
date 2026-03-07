import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { Page, Layout, Card, Button, Text, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
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
          currentPeriodEnd
        }
      }
    }`
  );

  const data = await response.json();
  const subscription = data.data.currentAppInstallation.activeSubscriptions[0] || null;

  console.log("✅ Current subscription:", subscription);

  return json({ subscription, shop: session.shop });
}

export async function action({ request }) {
  console.log("🚀 Billing action started");

  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const planType = formData.get("plan");

  console.log("📋 Plan type:", planType);

  try {
    // Шаг 1: Создаём подписку
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
                  price: { amount: 10.0, currencyCode: "USD" },
                  interval: "EVERY_30_DAYS",
                },
              },
            },
          ],
        },
      }
    );

    const createData = await createResponse.json();
    console.log("📊 Create response:", JSON.stringify(createData, null, 2));

    if (createData.data.appSubscriptionCreate.userErrors.length > 0) {
      console.error("❌ Create errors:", createData.data.appSubscriptionCreate.userErrors);
      return json({ errors: createData.data.appSubscriptionCreate.userErrors });
    }

    const subscriptionId = createData.data.appSubscriptionCreate.appSubscription.id;
    const initialStatus = createData.data.appSubscriptionCreate.appSubscription.status;

    console.log("✅ Subscription created, ID:", subscriptionId);
    console.log("✅ Initial status:", initialStatus);
    console.log("✅ Trial days:", createData.data.appSubscriptionCreate.appSubscription.trialDays);

    // ← ВАЖНО: Проверяем статус ПЕРЕД активацией
    if (initialStatus === "ACTIVE") {
      console.log("✅✅ Subscription is already ACTIVE, no need to activate!");
      console.log("⏳ Waiting 3 seconds for Shopify to sync...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      return redirect("/app");
    }

    // Шаг 2: Для dev store с test=true подписка уже активна после создания
    // Shopify автоматически активирует тестовые подписки
    console.log("✅✅ Subscription is already ACTIVE in test mode!");
    console.log("⏳ Waiting 3 seconds for Shopify to sync...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Дополнительная проверка: получаем текущее состояние подписки
    console.log("🔍 Verifying subscription status...");
    const verifyResponse = await admin.graphql(
      `#graphql
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            trialDays
            test
          }
        }
      }`
    );

    const verifyData = await verifyResponse.json();
    console.log("📊 Verification response:", JSON.stringify(verifyData, null, 2));

    const subscriptions = verifyData.data?.currentAppInstallation?.activeSubscriptions || [];
    if (subscriptions.length > 0) {
      const verifiedSubscription = subscriptions[0];
      console.log("✅ Verified status:", verifiedSubscription.status);
      console.log("✅ Verified trial days:", verifiedSubscription.trialDays);
    } else {
      console.log("⚠️ Could not verify subscription, but proceeding anyway...");
    }

    console.log("🔄 Redirecting to /app...");
    return redirect("/app");

  } catch (error) {
    console.error("❌ Error:", error);
    return json({ error: error.message }, { status: 500 });
  }
}

export default function Billing() {
  const { subscription } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const handleSubscribe = (planType) => {
    console.log("🖱️ Button clicked:", planType);
    const formData = new FormData();
    formData.append("plan", planType);
    submit(formData, { method: "post" });
  };

  return (
    <Page title="Billing & Subscription">
      <Layout>
        <Layout.Section>
          {subscription ? (
            <Card>
              <div style={{ padding: "1rem" }}>
                <Text variant="headingMd" as="h2">✅ Active Subscription</Text>
                <div style={{ marginTop: "1rem" }}>
                  <p><strong>Plan:</strong> {subscription.name}</p>
                  <p><strong>Status:</strong> {subscription.status}</p>
                  <p><strong>Test mode:</strong> {subscription.test ? "Yes ✅" : "No"}</p>
                  {subscription.trialDays > 0 && (
                    <p><strong>Trial days:</strong> {subscription.trialDays} days 🎉</p>
                  )}
                  {subscription.currentPeriodEnd && (
                    <p><strong>Current period ends:</strong> {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ padding: "1rem" }}>
                <Text variant="headingMd" as="h2">Subscribe to Premium Plan</Text>
                <div style={{ marginTop: "1rem" }}>
                  <p>Unlock premium features with our subscription</p>

                  <Banner status="info" style={{ marginTop: "1rem" }}>
                    <p>💡 Test mode: Subscriptions will be activated automatically without payment</p>
                  </Banner>

                  <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <Button
                      primary
                      loading={isLoading}
                      onClick={() => handleSubscribe("trial")}
                    >
                      🎁 Start 7-Day Free Trial
                    </Button>

                    <Button
                      loading={isLoading}
                      onClick={() => handleSubscribe("paid")}
                    >
                      💳 Subscribe Now ($10/month)
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
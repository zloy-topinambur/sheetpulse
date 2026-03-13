import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import { Page, Layout, Card, Button, Text, Banner } from "@shopify/polaris";
import { useEffect } from "react";
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

    if (createData.data.appSubscriptionCreate.userErrors.length > 0) {
      console.error("❌ Errors:", createData.data.appSubscriptionCreate.userErrors);
      return json({ errors: createData.data.appSubscriptionCreate.userErrors });
    }

    const confirmationUrl = createData.data.appSubscriptionCreate.confirmationUrl;

    console.log("✅ Subscription created:", createData.data.appSubscriptionCreate.appSubscription);
    console.log("✅ Confirmation URL:", confirmationUrl);

    // Возвращаем confirmationUrl для обработки на фронтенде
    return json({
      confirmationUrl,
      subscription: createData.data.appSubscriptionCreate.appSubscription
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return json({ error: error.message }, { status: 500 });
  }
}

export default function Billing() {
  const { subscription } = useLoaderData();
  const actionData = useActionData(); // Получаем данные из action
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  // Обрабатываем редирект на confirmationUrl
  useEffect(() => {
    if (actionData?.confirmationUrl) {
      console.log("🔄 Redirecting to Shopify confirmation page:", actionData.confirmationUrl);
      // Открываем в том же окне (top-level redirect)
      window.open(actionData.confirmationUrl, "_top");
    }
  }, [actionData]);

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
          {actionData?.error && (
            <Banner status="critical">
              <p>Error: {actionData.error}</p>
            </Banner>
          )}

          {actionData?.errors && (
            <Banner status="critical">
              <p>Errors: {actionData.errors.map(e => e.message).join(", ")}</p>
            </Banner>
          )}

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
                    <p>💡 <strong>Dev Store Note:</strong> You'll be redirected to Shopify's confirmation page. On development stores, you may need to add a payment method in Settings → Billing to complete the subscription.</p>
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

                    <Button
                      onClick={() => window.open('/app/update-widget', '_blank')}
                    >
                      🔧 Force Update Widget
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
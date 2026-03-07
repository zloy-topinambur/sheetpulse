import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text, Banner, Button, List, InlineStack, Badge, Form } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Проверка текущей подписки
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
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

    // Если уже есть активная подписка - редирект на главную
    if (subscription && subscription.status === 'ACTIVE') {
      return redirect("/app");
    }

    return json({
      subscription,
      shop: admin.session.shop || "unknown",
      requiresAuth: false
    });
    
  } catch (error) {
    console.error("❌ Billing check error:", error);
    return json({ 
      subscription: null, 
      error: error.message,
      shop: admin.session.shop || "unknown"
    });
  }
};

// Создание подписки
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const planType = formData.get("planType");
    
    const url = new URL(request.url);
    const returnUrl = `${url.origin}/app/billing`;

    const response = await admin.graphql(
      `#graphql
      mutation AppSubscriptionCreate(
        $name: String!
        $returnUrl: URL!
        $test: Boolean
        $lineItems: [AppSubscriptionLineItemInput!]!
      ) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          test: $test
          lineItems: $lineItems
        ) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appSubscription {
            id
            status
          }
        }
      }`,
      {
        variables: {
          name: "Monthly Subscription",
          returnUrl: returnUrl,
          test: true, // Для тестирования без реальных платежей
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: 4.99, currencyCode: "USD" },
                  interval: "EVERY_30_DAYS",
                },
              },
            },
          ],
        },
      }
    );

    const data = await response.json();
    if (data.data.appSubscriptionCreate.userErrors.length > 0) {
      console.error("❌ Subscription errors:", data.data.appSubscriptionCreate.userErrors);
      return json({ errors: data.data.appSubscriptionCreate.userErrors });
    }
    if (data.data.appSubscriptionCreate.confirmationUrl) {
      console.log("✅ Redirecting to:", data.data.appSubscriptionCreate.confirmationUrl);
      return redirect(data.data.appSubscriptionCreate.confirmationUrl);
    }
    return json({ success: true });
    
  } catch (error) {
    console.error("❌ Subscription creation error:", error);
    return json({ error: error.message }, { status: 500 });
  }
};

export default function Billing() {
  const { subscription, error } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <Page title="Billing - SheetPulse">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingLg">Subscribe to SheetPulse</Text>
                  {subscription?.trialDays > 0 && (
                    <Badge tone="info">Trial: {subscription.trialDays} days left</Badge>
                  )}
                </InlineStack>
                <Text variant="bodyMd">
                  Get started with 7 days free trial, then just $4.99/month.
                </Text>
              </BlockStack>
            </Card>

            {error && (
              <Banner title="Billing Error" tone="critical">
                <p>{error}</p>
              </Banner>
            )}

            {actionData?.error && (
              <Banner title="Subscription Error" tone="critical">
                <p>{actionData.error}</p>
              </Banner>
            )}

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">What's included:</Text>
                <List>
                  <List.Item>Unlimited survey responses</List.Item>
                  <List.Item>Google Sheets integration</List.Item>
                  <List.Item>Custom survey questions</List.Item>
                  <List.Item>Real-time analytics</List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Banner title="7-Day Free Trial" tone="info">
                  <p>Start your free trial today. No charges will be made until the trial ends.</p>
                </Banner>
                
                <BlockStack gap="200">
                  <Text variant="headingXl">$4.99/month</Text>
                  <Text tone="subdued">Billed monthly. Cancel anytime.</Text>
                </BlockStack>
                
                <BlockStack gap="300">
                  <Form method="post">
                    <input type="hidden" name="planType" value="trial" />
                    <Button 
                      variant="primary" 
                      size="large" 
                      submit
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Start Free Trial (Recommended)
                    </Button>
                  </Form>
                  
                  <Form method="post">
                    <input type="hidden" name="planType" value="paid" />
                    <Button 
                      variant="secondary" 
                      size="large" 
                      submit
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Subscribe Now ($4.99/month)
                    </Button>
                  </Form>
                </BlockStack>
                
                <Text tone="subdued" variant="bodySm">
                  Click a button above to proceed with subscription. You will be redirected to Shopify to confirm.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text variant="headingSm">Frequently Asked Questions</Text>
                <List>
                  <List.Item><b>Can I cancel anytime?</b> Yes, you can cancel your subscription at any time from your Shopify admin.</List.Item>
                  <List.Item><b>What happens after the trial?</b> You'll be charged $4.99/month unless you cancel before the trial ends.</List.Item>
                  <List.Item><b>Is there a money-back guarantee?</b> Yes, Shopify offers a 14-day money-back guarantee for app subscriptions.</List.Item>
                </List>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

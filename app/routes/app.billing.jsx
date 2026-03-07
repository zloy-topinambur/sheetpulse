import { redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text, Banner, Button, List, InlineStack, Badge, Form } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Планы подписки
const MONTHLY_PLAN = "Monthly Subscription";

export const loader = async ({ request }) => {
  let admin, session;
  
  try {
    console.log("🔍 Проверка аутентификации в биллинге...");
    const auth = await authenticate.admin(request);
    admin = auth.admin;
    session = auth.session;
    console.log("✅ Аутентификация успешна, магазин:", session.shop);
  } catch (error) {
    console.log("⚠️ Auth error:", error.message);
    throw error;
  }

  // Проверяем статус подписки
  let billingStatus = { hasPayment: false, isTrial: false, trialDaysRemaining: 0 };
  
  try {
    console.log("🔍 Проверка биллинга...");
    const billingCheck = await admin.billing.check({
      plans: [MONTHLY_PLAN],
    });
    console.log("✅ Billing check result:", billingCheck);
    
    billingStatus.hasPayment = billingCheck.hasActivePayment || false;
    
    if (billingCheck.appSubscriptions && billingCheck.appSubscriptions.length > 0) {
      const sub = billingCheck.appSubscriptions[0];
      billingStatus.isTrial = sub.status === 'ACTIVE' && sub.trialDays > 0;
      
      if (sub.trialDays > 0 && sub.createdAt) {
        const createdDate = new Date(sub.createdAt);
        const now = new Date();
        const daysPassed = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        billingStatus.trialDaysRemaining = Math.max(0, sub.trialDays - daysPassed);
      }
    }
  } catch (err) {
    console.log("❌ Billing check error:", err.message);
    console.log("❌ Admin object:", !!admin);
    console.log("❌ Admin.billing:", !!admin?.billing);
  }

  // Если уже есть активная подписка - редирект на главную
  if (billingStatus.hasPayment) {
    return redirect("/app");
  }

  return json({
    billingStatus,
    shop: session?.shop || "unknown",
    requiresAuth: false
  });
};

export const action = async ({ request }) => {
  let admin, session;
  
  try {
    const auth = await authenticate.admin(request);
    admin = auth.admin;
    session = auth.session;
  } catch (error) {
    console.log("⚠️ Auth error in action:", error.message);
    return json({ error: "Authentication failed. Please refresh the page." });
  }
  
  const formData = await request.formData();
  const planType = formData.get("planType");
  
  const url = new URL(request.url);
  const returnUrl = `${url.origin}/app/billing`;

  try {
    let billingResponse;
    
    if (planType === "trial") {
      console.log("📊 Creating subscription with trial...");
      billingResponse = await admin.billing.request({
        plan: MONTHLY_PLAN,
        returnUrl,
      });
    } else if (planType === "paid") {
      console.log("📊 Creating subscription without trial...");
      billingResponse = await admin.billing.request({
        plan: MONTHLY_PLAN,
        trialDays: 0,
        returnUrl,
      });
    }
    
    // ✅ Редирект на страницу подтверждения Shopify
    if (billingResponse && billingResponse.confirmationUrl) {
      return redirect(billingResponse.confirmationUrl);
    }
    
  } catch (err) {
    console.log("Billing request error:", err.message);
    return json({ error: err.message });
  }

  return json({ error: "Failed to create subscription" });
};

export default function Billing() {
  const { billingStatus } = useLoaderData();
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
                  {billingStatus.isTrial && billingStatus.trialDaysRemaining > 0 && (
                    <Badge tone="info">Trial: {billingStatus.trialDaysRemaining} days left</Badge>
                  )}
                </InlineStack>
                <Text variant="bodyMd">
                  Get started with 7 days free trial, then just $4.99/month.
                </Text>
              </BlockStack>
            </Card>

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

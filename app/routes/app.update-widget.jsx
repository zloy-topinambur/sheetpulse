import { json } from "@remix-run/node";
import { useLoaderData, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server.js";
import { Button, Card, Page, Text } from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Shopify API для обновления Extensions
    const response = await fetch(`https://${session.shop}/admin/api/2025-04/extensions.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': session.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        extension: {
          type: 'theme',
          handle: 'survey-widget',
          force_update: true
        }
      })
    });

    if (response.ok) {
      return json({ success: true, message: 'Widget updated successfully' });
    } else {
      return json({ success: false, message: 'Failed to update widget' });
    }
  } catch (error) {
    return json({ success: false, message: 'Error updating widget' });
  }
};

export default function UpdateWidget() {
  const { shop } = useLoaderData();
  const actionData = useActionData();

  return (
    <Page title="Update Widget">
      <Card>
        <Text variant="headingMd" as="h2">Force Widget Update</Text>
        <Text variant="bodyMd" as="p" color="subdued">
          Force update the SheetPulse widget to get the latest version.
        </Text>
        
        {actionData?.success && (
          <div style={{ color: 'green', margin: '10px 0' }}>
            ✅ {actionData.message}
          </div>
        )}
        
        {actionData?.success === false && (
          <div style={{ color: 'red', margin: '10px 0' }}>
            ❌ {actionData.message}
          </div>
        )}
        
        <form method="post">
          <Button primary type="submit">
            Force Update Widget
          </Button>
        </form>
      </Card>
    </Page>
  );
}
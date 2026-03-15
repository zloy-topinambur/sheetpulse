import { json } from "@remix-run/node";
import { useLoaderData, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server.js";
import { Button, Card, Page, Text } from "@shopify/polaris";

// Функция для правильного формирования URL (копия из shopify.server.js)
function getAppUrl() {
  const url = process.env.SHOPIFY_APP_URL || process.env.APP_URL;
  if (!url) {
    // Для Render по умолчанию используем стандартный URL
    return "https://sheetpulse.onrender.com";
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  
  try {
    // NOTE:
    // Shopify does NOT provide a stable REST endpoint to "force update" a Theme App Extension.
    // Theme extensions must be deployed via Shopify CLI (shopify app deploy).
    // What we can do here is ensure the app_url metafield is set so Liquid can load the widget.

    const appRes = await admin.graphql(`{currentAppInstallation{id}}`);
    const appResData = await appRes.json();
    if (appResData.errors) {
      return json({
        success: false,
        message: `Failed to read currentAppInstallation.id: ${JSON.stringify(appResData.errors)}`,
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
              ownerId: appId,
            },
          ],
        },
      },
    );

    const resultData = await result.json();
    const userErrors = resultData.data?.metafieldsSet?.userErrors || [];

    return json({
      success: userErrors.length === 0,
      message:
        userErrors.length === 0
          ? "✅ app_url metafield updated. Note: Theme App Extension updates still require Shopify CLI deploy."
          : `Metafield update errors: ${JSON.stringify(userErrors)}`,
    });
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
        <Text variant="headingMd" as="h2">Widget Sync</Text>
        <Text variant="bodyMd" as="p" color="subdued">
          Ensures your store has correct app URL for loading widget assets.
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
          <Button primary type="submit">Sync Widget</Button>
        </form>
      </Card>
    </Page>
  );
}
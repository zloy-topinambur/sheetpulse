import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;

    // Получаем метафилды приложения
    const metafieldsResponse = await fetch(
      `https://${shop}/admin/api/2024-10/metafields.json?namespace=sheet_pulse&owner_resource=app&owner_id=${session.shop}`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!metafieldsResponse.ok) {
      throw new Error(`Failed to fetch metafields: ${metafieldsResponse.status}`);
    }

    const metafieldsData = await metafieldsResponse.json();
    const metafields = metafieldsData.metafields || [];

    // Преобразуем метафилды в объект для удобства доступа
    const metafieldsObj = {};
    metafields.forEach((mf) => {
      metafieldsObj[mf.key] = mf.value;
    });

    // Формируем конфигурацию для виджета
    const config = {
      questions: metafieldsObj.q_json || [],
      googleUrl: metafieldsObj.g_url || "",
      triggerType: metafieldsObj.t_type || "timer",
      tVal: metafieldsObj.t_val || "3",
      targetDevice: metafieldsObj.t_dev || "all",
      accentColor: metafieldsObj.a_col || "000000",
      lang: metafieldsObj.lang || "en",
      status: metafieldsObj.status || "inactive",
      surveyVersion: metafieldsObj.survey_version || "",
      widgetPosition: metafieldsObj.w_pos || "right",
    };

    return json(config);
  } catch (error) {
    console.error("Error fetching survey config:", error);
    return json(
      { error: "Failed to fetch survey configuration" },
      { status: 500 }
    );
  }
}
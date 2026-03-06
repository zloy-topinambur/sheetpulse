import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // После успешной OAuth аутентификации - редирект на биллинг
  await authenticate.admin(request);

  // Если есть подписка - на главную, если нет - на биллинг
  return redirect("/app/billing");
};

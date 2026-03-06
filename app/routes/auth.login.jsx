import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  // Embedded apps: пользователь уже аутентифицирован через токен
  // Просто редиректим на главную
  try {
    await authenticate.admin(request);
    return redirect("/app");
  } catch (e) {
    // Если не аутентифицирован - показываем сообщение
    return new Response("Please open the app from Shopify Admin", { status: 200 });
  }
}

export async function action({ request }) {
  return loader({ request });
}

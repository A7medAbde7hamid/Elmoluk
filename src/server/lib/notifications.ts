const WHATSAPP_API_VERSION = "v22.0";
const WHATSAPP_BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return { phoneNumberId, accessToken };
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  const config = getConfig();
  if (!config) {
    console.warn("[WhatsApp] Config missing - WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set. Message not sent.");
    console.warn("[WhatsApp] Message would have been sent to:", to);
    console.warn("[WhatsApp] Message body:", body);
    return false;
  }

  try {
    const res = await fetch(`${WHATSAPP_BASE_URL}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/^\+/, ""),
        type: "text",
        text: { body },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[WhatsApp] Failed to send message:", res.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);
    return false;
  }
}

export function getWhatsAppLink(phone: string, text: string): string {
  const cleaned = phone.replace(/^\+/, "").replace(/\s/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

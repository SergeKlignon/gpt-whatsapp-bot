import axios from "axios";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const { method, nextUrl } = req;
  const VERIFY_TOKEN = "grando-token-2024";
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (method === "GET") {
    const mode = nextUrl.searchParams.get("hub.mode");
    const token = nextUrl.searchParams.get("hub.verify_token");
    const challenge = nextUrl.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Erreur de vérification", { status: 403 });
    }
  }

  if (method === "POST") {
    try {
      const reqBody = await req.json();
      const message = reqBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) return new Response("Aucun message à traiter", { status: 200 });

      const from = message.from;
      const userText = message.text.body;

      console.log("📩 Message reçu :", userText);

      const gptResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo", // ✅ Modèle accessible à tous
          messages: [
            {
              role: "system",
              content: "Tu es un assistant bienveillant et chrétien nommé Grando, qui conseille avec amour, sagesse et vérité.",
            },
            {
              role: "user",
              content: userText,
            },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const gptReply = gptResponse.data.choices[0].message.content;
      console.log("🤖 Réponse de GPT :", gptReply);

      await axios.post(
        `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: gptReply },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      return new Response("EVENT_RECEIVED", { status: 200 });
    } catch (err) {
      console.error("❌ Erreur dans le webhook :", err.response?.data || err.message);
      return new Response("Erreur serveur", { status: 500 });
    }
  }

  return new Response("Méthode non autorisée", { status: 405 });
}

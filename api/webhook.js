import axios from "axios";

export default async function handler(req, res) {
  const VERIFY_TOKEN = "grando-token-2024";
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Erreur de vérification");
    }
  }

  if (req.method === "POST") {
    const body = req.body;

    try {
      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) return res.sendStatus(200); // rien à traiter

      const from = message.from;
      const userText = message.text.body;

      // Appel à OpenAI GPT-4
      const gptResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
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

      // Répondre via WhatsApp
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

      return res.sendStatus(200);
    } catch (err) {
      console.error("Erreur :", err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }

  return res.status(405).send("Méthode non autorisée");
}

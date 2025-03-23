export default function handler(req, res) {
  const VERIFY_TOKEN = "grando-token-2024"; // C'est ton token, à mettre aussi dans Meta

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK VERIFIÉ AVEC SUCCÈS !");
      res.status(200).send(challenge);
    } else {
      console.log("ERREUR DE TOKEN !");
      res.status(401).send("Unauthorized - Bad verify token");
    }
  } else if (req.method === "POST") {
    const body = req.body;
    console.log("Message reçu :", JSON.stringify(body, null, 2));
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.status(405).send("Méthode non autorisée");
  }
}

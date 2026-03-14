import express from "express";
import { personaHandler } from "./routes/persona.js";
import { docusignHandler } from "./routes/docusign.js";
import { stripeHandler } from "./routes/stripe.js";

const app = express();
const PORT = process.env.PORT ?? 3030;

// Webhooks MUST get raw body for signature verification (before express.json)
app.post("/persona", express.raw({ type: "application/json" }), personaHandler);
app.post("/docusign", express.raw({ type: "application/json" }), docusignHandler);
app.post("/stripe", express.raw({ type: "application/json" }), stripeHandler);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Webhooks server listening on port ${PORT}`);
});

import { Router } from "express";
import { webhookHandler } from "../modules/webhook/webhookHandler";

const router = Router();

const VERIFY_TOKEN = "clinic_os_token";

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/webhook", async (req, res) => {
  const value = req.body?.entry?.[0]?.changes?.[0]?.value;

  await webhookHandler(value);

  return res.sendStatus(200);
});

export default router;

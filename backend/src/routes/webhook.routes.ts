import { uidaiEsignWebhook } from "../controllers/uidai.controller";

export const registerWebhookRoutes = (app: any) => {
    app.post("/webhooks/esign/uidai", uidaiEsignWebhook);
};


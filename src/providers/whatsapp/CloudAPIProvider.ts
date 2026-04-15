import { IWhatsAppProvider } from "./IWhatsAppProvider";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

const MAX_RETRIES = 2;
const TIMEOUT_MS = 5000;

export class CloudAPIProvider implements IWhatsAppProvider {
  private token: string;
  private phoneNumberId: string;
  private apiUrl: string;

  constructor() {
    this.token = env.WHATSAPP_TOKEN;
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;

    this.apiUrl =
      process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v25.0";
  }

  async sendMessage(phone: string, message: string) {
    const number = phone.replace(/\D/g, "");
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

    const headers = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    const body = JSON.stringify({
      messaging_product: "whatsapp",
      to: number,
      type: "text",
      text: {
        body: message,
      },
    });

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        logger.info({
          msg: "whatsapp_send_attempt",
          to: number,
          attempt,
        });

        const response = await fetch(url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const data = await response.json();

        if (!response.ok) {
          logger.error({
            msg: "whatsapp_api_error",
            statusCode: response.status,
            data,
            to: number,
            attempt,
          });

          // DO NOT retry on 4xx — client errors are not transient
          if (response.status >= 400 && response.status < 500) {
            throw new Error(
              data?.error?.message || "Failed to send WhatsApp message",
            );
          }

          lastError = new Error(
            data?.error?.message || "Failed to send WhatsApp message",
          );
          continue;
        }

        logger.info({
          msg: "whatsapp_message_sent",
          to: number,
          attempt,
        });

        return data;
      } catch (error: unknown) {
        clearTimeout(timeout);
        lastError = error;

        // If it's an AbortError or network error, retry
        const isAbort =
          error instanceof Error && error.name === "AbortError";
        const isNetworkError =
          error instanceof TypeError &&
          error.message.includes("fetch");

        if (!isAbort && !isNetworkError) {
          // Non-retryable error (e.g. 4xx threw above)
          logger.error({
            msg: "whatsapp_request_failed",
            error,
            to: number,
            attempt,
          });
          throw error;
        }

        logger.warn({
          msg: "whatsapp_retry",
          to: number,
          attempt,
          reason: isAbort ? "timeout" : "network_error",
        });

        if (attempt <= MAX_RETRIES) {
          const delay = 500 * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    logger.error({
      msg: "whatsapp_all_retries_exhausted",
      to: number,
      maxRetries: MAX_RETRIES,
    });

    throw lastError;
  }
}

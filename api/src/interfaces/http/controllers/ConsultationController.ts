import { Request, Response, NextFunction } from "express";
import { AuthContext } from "../types";
import { logger } from "../../../lib/logger";

export class ConsultationController {
  transcribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (req as Request & { auth: AuthContext }).auth;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "Audio file is required" });
        return;
      }

      if (!process.env.OPENAI_API_KEY) {
        res.status(500).json({ error: "OPENAI_API_KEY not configured" });
        return;
      }

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
      formData.append("file", blob, file.originalname || "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "pt");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData as any
      });

      if (!response.ok) {
        logger.error({ event: "openai.whisper.error", status: response.status });
        res.status(500).json({ error: "Failed to transcribe audio" });
        return;
      }

      const data = await response.json();
      res.json({ data: { text: data.text } });
    } catch (error) {
      logger.error({ event: "controller.consultation.transcribe.error", error });
      next(error);
    }
  };
}

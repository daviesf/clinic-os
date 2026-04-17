import { AIRouter } from "./aiRouter";
import { AIClassification } from "./types";

export class IntentService {
  private aiRouter: AIRouter;

  constructor() {
    this.aiRouter = new AIRouter();
  }

  classify(content: string, tenantId: string): AIClassification {
    return this.aiRouter.classify(content, false, tenantId);
  }
}

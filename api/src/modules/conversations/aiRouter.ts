import { IntentLoader } from "./intent/intent.loader";
import { IntentResolver } from "./intent/intent.resolver";
import { AIClassification } from "./types";

export class AIRouter {
  private readonly resolver: IntentResolver;

  constructor() {
    const loader = new IntentLoader();
    this.resolver = new IntentResolver(loader);
  }

  classify(
    message: string,
    debug = false,
    tenantId?: string,
  ): AIClassification {
    return this.resolver.resolve(message);
  }
}

import { IIntentHandler } from "./IIntentHandler";
import { ScheduleIntentHandler } from "./handlers/ScheduleIntentHandler";
import { DefaultIntentHandler } from "./handlers/DefaultIntentHandler";
import { EmergencyIntentHandler } from "./handlers/EmergencyIntentHandler";

export class IntentHandlerRegistry {
  private handlers = new Map<string, IIntentHandler>();
  private defaultHandler: IIntentHandler;

  constructor() {
    this.defaultHandler = new DefaultIntentHandler();
    this.handlers.set("SCHEDULE", new ScheduleIntentHandler());
    this.handlers.set("EMERGENCY", new EmergencyIntentHandler());
  }

  getHandler(intent: string): IIntentHandler {
    return this.handlers.get(intent) || this.defaultHandler;
  }
}

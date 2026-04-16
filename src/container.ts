import { CloudAPIProvider } from "./providers/whatsapp/CloudAPIProvider";
import { MockWhatsAppProvider } from "./providers/whatsapp/MockWhatsAppProvider";
import { WhatsAppService } from "./modules/whatsapp/service";
import { SchedulingService } from "./modules/scheduling/service";
import { ConversationEngine } from "./modules/conversations/engine";
import { PromptService } from "./modules/ai/promptService";

const whatsappProvider = process.env.NODE_ENV === "production" 
  ? new CloudAPIProvider() 
  : new MockWhatsAppProvider();

const whatsappService = new WhatsAppService(whatsappProvider);
const promptService = new PromptService();

const schedulingService = new SchedulingService(whatsappService);
const conversationEngine = new ConversationEngine(whatsappService, promptService);

export { whatsappService, schedulingService, conversationEngine };

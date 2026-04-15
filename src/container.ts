import { CloudAPIProvider } from "./providers/whatsapp/CloudAPIProvider";
import { WhatsAppService } from "./modules/whatsapp/service";
import { SchedulingService } from "./modules/scheduling/service";
import { ConversationEngine } from "./modules/conversations/engine";

const whatsappProvider = new CloudAPIProvider();
const whatsappService = new WhatsAppService(whatsappProvider);

const schedulingService = new SchedulingService(whatsappService);
const conversationEngine = new ConversationEngine(whatsappService);

export { whatsappService, schedulingService, conversationEngine };

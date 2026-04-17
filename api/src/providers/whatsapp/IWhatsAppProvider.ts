export type OutboundMessage = 
  | { type: "text"; to: string; text: string }
  | { type: "audio"; to: string; url: string }
  | { type: "media"; to: string; url: string; caption?: string }
  | { type: "reply"; to: string; text: string; replyToMessageId: string };

export interface IWhatsAppProvider {
  sendMessage(payload: OutboundMessage): Promise<any>;
}

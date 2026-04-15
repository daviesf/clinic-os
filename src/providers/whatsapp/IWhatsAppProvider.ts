export interface IWhatsAppProvider {
  sendMessage(phone: string, message: string): Promise<any>;
}

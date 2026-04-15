function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const env = {
  WHATSAPP_TOKEN: getEnv("WHATSAPP_TOKEN"),
  WHATSAPP_PHONE_NUMBER_ID: getEnv("WHATSAPP_PHONE_NUMBER_ID"),
  DATABASE_URL: getEnv("DATABASE_URL"),
};

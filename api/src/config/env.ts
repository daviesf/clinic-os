import dotenv from "dotenv";
dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing env var: ${name}`);
  }
  return value || "";
}

export const env = {
  WHATSAPP_TOKEN: getEnv("WHATSAPP_TOKEN"),
  WHATSAPP_PHONE_NUMBER_ID: getEnv("WHATSAPP_PHONE_NUMBER_ID"),
  WHATSAPP_APP_SECRET: getEnv("WHATSAPP_APP_SECRET"),
  JWT_SECRET: process.env.JWT_SECRET || "clinicos_dev_secret_change_me",
  DATABASE_URL: getEnv("DATABASE_URL"),
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "clinic_os_token",
};

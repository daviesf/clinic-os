import crypto from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(12);
    // Use JWT_SECRET or a dedicated ENCRYPTION_KEY. JWT_SECRET might not be 32 bytes, so hash it to get 32 bytes.
    const key = crypto.createHash("sha256").update(env.JWT_SECRET || "default_secret").digest();
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag().toString("base64");
    
    return `enc:${iv.toString("base64")}:${authTag}:${encrypted}`;
  } catch (e) {
    return text;
  }
}

export function decrypt(hash: string): string {
  if (!hash || !hash.startsWith("enc:")) return hash;
  
  try {
    const [, iv64, authTag64, encrypted] = hash.split(":");
    const iv = Buffer.from(iv64, "base64");
    const authTag = Buffer.from(authTag64, "base64");
    const key = crypto.createHash("sha256").update(env.JWT_SECRET || "default_secret").digest();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (e) {
    return hash; // Return original if decryption fails
  }
}

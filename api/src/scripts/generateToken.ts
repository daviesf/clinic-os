/**
 * Dev utility: Generate a JWT token for API testing.
 *
 * Usage: npx ts-node src/scripts/generateToken.ts [tenantId] [userId]
 *
 * Example:
 *   npx ts-node src/scripts/generateToken.ts abc-123 user-456
 */
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const tenantId = process.argv[2] || "dev-tenant-id";
const userId = process.argv[3] || "dev-user-id";

const token = jwt.sign(
  {
    userId,
    tenantId,
    role: "admin",
  },
  env.JWT_SECRET,
  { expiresIn: "24h" }
);

console.log("\n🔑 Generated JWT Token:\n");
console.log(token);
console.log("\n📋 Payload:");
console.log(JSON.stringify({ userId, tenantId, role: "admin" }, null, 2));
console.log(`\n💡 Usage: curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/conversations\n`);

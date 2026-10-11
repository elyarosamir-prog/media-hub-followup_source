// Usage: node scripts/hash-password.mjs "your-password"
// Prints the value to paste into the ADMIN_PASSWORD_HASH environment variable.
import { randomBytes, scrypt } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Usage: node scripts/hash-password.mjs "<password of 10+ characters>"');
  process.exit(1);
}
const salt = randomBytes(16);
scrypt(password, salt, 64, (err, key) => {
  if (err) throw err;
  console.log(`scrypt$${salt.toString("hex")}$${key.toString("hex")}`);
});

import { connectDB } from "./db";
import { User } from "./models/User";
import bcrypt from "bcryptjs";

let bootstrapped = false;

export async function bootstrapSuperAdmin() {
  if (bootstrapped) return;
  bootstrapped = true;

  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || "Super Admin";

  if (!email || !password) return;

  await connectDB();

  const existing = await User.findOne({ role: "super_admin" });

  if (!existing) {
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, role: "super_admin", isActive: true });
    console.log("[bootstrap] Super admin created:", email);
    return;
  }

  const passwordMatch = await bcrypt.compare(password, existing.password);
  const needsUpdate = existing.email !== email || existing.name !== name || !passwordMatch;

  if (needsUpdate) {
    const hashed = !passwordMatch ? await bcrypt.hash(password, 10) : existing.password;
    // Use findByIdAndUpdate to bypass the pre-save hook (avoids double-hashing)
    await User.findByIdAndUpdate(existing._id, { email, name, password: hashed });
    console.log("[bootstrap] Super admin updated:", email);
  }
}

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
    // No super admin yet — create one with hashed password
    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { role: "super_admin" },
      { name, email, password: hashed, role: "super_admin", isActive: true },
      { upsert: true, new: true }
    );
    console.log("[bootstrap] Super admin created:", email);
    return;
  }

  // Only update if email or name changed — never touch password here
  // Password changes should be done via seed.mjs
  if (existing.email !== email || existing.name !== name) {
    await User.findByIdAndUpdate(existing._id, { email, name });
    console.log("[bootstrap] Super admin email/name updated:", email);
  }
}

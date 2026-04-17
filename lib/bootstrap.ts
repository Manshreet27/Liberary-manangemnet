import { connectDB } from "./db";
import { User } from "./models/User";
import bcrypt from "bcryptjs";

export async function bootstrapSuperAdmin() {
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
  } else {
    // Update email, name, and password if env changed
    const passwordChanged = !(await bcrypt.compare(password, existing.password));
    const needsUpdate =
      existing.email !== email ||
      existing.name !== name ||
      passwordChanged;

    if (needsUpdate) {
      existing.email = email;
      existing.name = name;
      if (passwordChanged) existing.password = password; // pre-save hook will hash it
      await existing.save();
      console.log("[bootstrap] Super admin updated:", email);
    }
  }
}

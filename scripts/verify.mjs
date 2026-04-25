import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const client = new MongoClient("mongodb+srv://kaurmanshreet_db_user:sK081nRgRUrVOU2y@cluster0.31thf6e.mongodb.net/library_management");

async function verify() {
  await client.connect();
  const db = client.db();
  const user = await db.collection("users").findOne({ role: "super_admin" });
  if (!user) { console.log("NO SUPER ADMIN FOUND"); await client.close(); return; }
  console.log("email:", user.email);
  console.log("hash:", user.password?.substring(0, 30));
  const ok = await bcrypt.compare("password123", user.password);
  console.log("password123 matches:", ok);
  await client.close();
}

verify().catch(console.error);

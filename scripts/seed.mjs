// Run: node scripts/seed.mjs
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcryptjs";

// Read .env.local
const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);

const MONGODB_URI = env.MONGODB_URI;
const SUPERADMIN_EMAIL = env.SUPERADMIN_EMAIL || "superadmin@library.com";
const SUPERADMIN_PASSWORD = env.SUPERADMIN_PASSWORD || "password123";
const SUPERADMIN_NAME = env.SUPERADMIN_NAME || "Super Admin";

const client = new MongoClient(MONGODB_URI);

async function seed() {
  await client.connect();
  const db = client.db();

  await db.collection("users").deleteMany({});
  await db.collection("libraries").deleteMany({});
  await db.collection("packages").deleteMany({});

  const library = await db.collection("libraries").insertOne({
    name: "City Central Library",
    address: "123 Main Street",
    phone: "+911234567890",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const superHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
  const defaultHash = await bcrypt.hash("password123", 10);

  await db.collection("users").insertMany([
    {
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      password: superHash,
      role: "super_admin",
      library: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Library Admin",
      email: "admin@library.com",
      password: defaultHash,
      role: "admin",
      library: library.insertedId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Receptionist",
      email: "receptionist@library.com",
      password: defaultHash,
      role: "receptionist",
      library: library.insertedId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  await db.collection("packages").insertMany([
    {
      name: "Monthly Basic",
      type: "monthly",
      price: 500,
      durationDays: 30,
      library: library.insertedId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Yearly Premium",
      type: "yearly",
      price: 5000,
      durationDays: 365,
      library: library.insertedId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log("Seed complete!");
  console.log(`Super Admin: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);
  console.log("Admin:        admin@library.com / password123");
  console.log("Receptionist: receptionist@library.com / password123");
  await client.close();
}

seed().catch(console.error);

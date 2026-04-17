// Run: npx ts-node --project tsconfig.json scripts/seed.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/library_management";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

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

  const hashedPassword = await bcrypt.hash("password123", 10);

  await db.collection("users").insertMany([
    {
      name: "Super Admin",
      email: "superadmin@library.com",
      password: hashedPassword,
      role: "super_admin",
      library: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Library Admin",
      email: "admin@library.com",
      password: hashedPassword,
      role: "admin",
      library: library.insertedId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Receptionist",
      email: "receptionist@library.com",
      password: hashedPassword,
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
  console.log("superadmin@library.com / password123");
  console.log("admin@library.com / password123");
  console.log("receptionist@library.com / password123");
  await mongoose.disconnect();
}

seed().catch(console.error);

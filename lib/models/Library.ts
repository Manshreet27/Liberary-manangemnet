import mongoose, { Schema, model, models } from "mongoose";

const LibrarySchema = new Schema(
  {
    name: { type: String, required: true },
    address: String,
    phone: String,
    biometricApiUrl: String,
    biometricApiKey: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Library = models.Library || model("Library", LibrarySchema);

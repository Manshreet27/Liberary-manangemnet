import { Schema, model, models } from "mongoose";

const PackageSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["monthly", "yearly"], required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true }, // 30 or 365
    library: { type: Schema.Types.ObjectId, ref: "Library", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Package = models.Package || model("Package", PackageSchema);

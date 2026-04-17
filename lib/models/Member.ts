import { Schema, model, models } from "mongoose";

const MemberSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    email: String,
    address: String,
    photo: String,
    idProof: String,
    biometricId: String, // ID in biometric device
    library: { type: Schema.Types.ObjectId, ref: "Library", required: true },
    package: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    packageStartDate: { type: Date, required: true },
    packageEndDate: { type: Date, required: true },
    feeStatus: {
      type: String,
      enum: ["paid", "unpaid", "partial"],
      default: "unpaid",
    },
    amountPaid: { type: Number, default: 0 },
    seatNumber: String,
    isActive: { type: Boolean, default: true },
    alertsSent: [
      {
        sentAt: Date,
        type: String, // "5day", "1day", "expired"
      },
    ],
  },
  { timestamps: true }
);

export const Member = models.Member || model("Member", MemberSchema);

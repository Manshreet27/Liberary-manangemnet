import { Schema, model, models } from "mongoose";

const AttendanceSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    library: { type: Schema.Types.ObjectId, ref: "Library", required: true },
    biometricId: String,
    checkIn: { type: Date, required: true },
    checkOut: Date,
    source: { type: String, enum: ["biometric", "manual"], default: "biometric" },
  },
  { timestamps: true }
);

export const Attendance = models.Attendance || model("Attendance", AttendanceSchema);

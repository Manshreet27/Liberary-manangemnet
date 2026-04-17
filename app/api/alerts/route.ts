import { connectDB } from "@/lib/db";
import { Member } from "@/lib/models/Member";
import "@/lib/models/Package";
import "@/lib/models/Library";
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

async function sendWhatsApp(to: string, message: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:${to}`,
    body: message,
  });
}

// Called by a cron job or manually — checks expiring members and sends WhatsApp alerts
export async function POST(req: NextRequest) {
  // Secure with a secret header for cron calls
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const in5Days = new Date();
  in5Days.setDate(now.getDate() + 5);

  // Find members whose package ends within 5 days and fee is unpaid/partial
  const expiringMembers = await Member.find({
    isActive: true,
    feeStatus: { $in: ["unpaid", "partial"] },
    packageEndDate: { $gte: now, $lte: in5Days },
  }).populate("package library");

  let sent = 0;
  for (const member of expiringMembers) {
    const daysLeft = Math.ceil(
      (new Date(member.packageEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const alertType = daysLeft <= 1 ? "1day" : "5day";
    const alreadySent = member.alertsSent?.some((a: any) => {
      const sentDate = new Date(a.sentAt);
      const today = new Date();
      return (
        a.type === alertType &&
        sentDate.toDateString() === today.toDateString()
      );
    });

    if (alreadySent) continue;

    const message =
      `Hello ${member.name}! 👋\n\n` +
      `Your *${member.package?.name}* membership at *${member.library?.name}* ` +
      `expires in *${daysLeft} day(s)* on ${new Date(member.packageEndDate).toLocaleDateString()}.\n\n` +
      `Your fee is currently *${member.feeStatus}*. Please renew to continue enjoying our services.\n\n` +
      `Contact us for renewal. Thank you! 🙏`;

    try {
      await sendWhatsApp(member.whatsapp, message);
      member.alertsSent.push({ sentAt: new Date(), type: alertType });
      await member.save();
      sent++;
    } catch (err) {
      console.error(`Failed to send WhatsApp to ${member.whatsapp}:`, err);
    }
  }

  return NextResponse.json({ sent, checked: expiringMembers.length });
}

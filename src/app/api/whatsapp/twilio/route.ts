// app/api/whatsapp/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/lib/message-processor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const formDataObj = Object.fromEntries(formData.entries());

    const { From: from, Body: message, MessageType: type } = formDataObj;

    console.log("Mensagem recebida via Twilio:", {
      from: from?.toString(),
      message: message?.toString().substring(0, 50),
    });

    if (!from || !message) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Processar a mensagem
    await processMessage(
      from.toString(),
      message.toString(),
      type?.toString() || "text"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook Twilio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

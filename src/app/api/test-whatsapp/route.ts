// app/api/test-whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const { message, to } = await request.json();

    if (!message || !to) {
      return NextResponse.json(
        { error: "Message and to are required" },
        { status: 400 }
      );
    }

    // Formatar número para padrão E.164
    const formatNumber = (numero: string) => {
      const digits = numero.replace(/\D/g, '');
      return `whatsapp:+55${digits}`;
    };

    const formattedTo = formatNumber(to);

    // Enviar mensagem via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: formattedTo
    });

    console.log("Mensagem enviada com sucesso:", result.sid);

    return NextResponse.json({
      success: true,
      messageId: result.sid,
      to: formattedTo,
      status: result.status
    });

  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
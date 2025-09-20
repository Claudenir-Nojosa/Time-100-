// app/api/.well-known/twilio-domain-verification/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Retorne apenas o texto de verificação
  return new Response('twilio-domain-verification=28554727263a470b8e9bfabe1d134dab', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
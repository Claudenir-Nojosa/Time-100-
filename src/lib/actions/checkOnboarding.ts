// actions/checkOnboarding.ts
"use server";

import db from "@/lib/db";

export async function checkOnboarding(usuarioId: string) {
  const respostas = await db.respostasPosLogin.findUnique({
    where: { usuarioId },
  });

  // Retorna `true` se o usuário já respondeu ao onboarding, caso contrário, `false`
  return !!respostas;
}
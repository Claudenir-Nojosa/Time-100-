/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { signIn } from "../../../../auth";
import db from "@/lib/db";
import { AuthError } from "next-auth";

const ALLOWED_EMAIL = "clau.nojosaf@gmail.com";

export default async function loginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const provider = formData.get("provider") as string | null;

  try {
    // Se for login por Google, verificar o e-mail permitido
    if (provider === "google" && email !== ALLOWED_EMAIL) {
      return { 
        success: false, 
        message: "Apenas o e-mail específico pode fazer login com Google" 
      };
    }

    await signIn(provider || "credentials", {
      email,
      password: formData.get("password") as string,
      redirect: false,
    });

    // Verifica se o usuário já completou o onboarding
    const user = await db.usuario.findUnique({
      where: { email },
    });

    return { success: true, message: "Login realizado com sucesso!" };
  } catch (e: any) {
    if (e instanceof AuthError) {
      switch (e.type) {
        case "CredentialsSignin":
          return { success: false, message: "Dados de login incorretos" };
        case "AccessDenied":
          return { success: false, message: e.message || "Acesso negado" };
        default:
          return { success: false, message: "Ops, algum erro aconteceu!" };
      }
    }
    console.error(e);
    return { success: false, message: "Ops, algum erro aconteceu!" };
  }
}
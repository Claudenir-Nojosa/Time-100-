/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { signIn } from "../../../../auth";
import db from "@/lib/db";

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
    const user = await db.user.findUnique({
      where: { email },
    });

    return { success: true, message: "Login realizado com sucesso!" };
  } catch (e: any) {
    // No NextAuth v4, os erros são strings ou objetos Error, não AuthError
    if (typeof e === 'string') {
      return { success: false, message: e };
    }
    
    if (e instanceof Error) {
      // Trata erros específicos do NextAuth v4
      if (e.message.includes('CredentialsSignin') || e.message.includes('credential')) {
        return { success: false, message: "Dados de login incorretos" };
      }
      if (e.message.includes('AccessDenied') || e.message.includes('access denied')) {
        return { success: false, message: "Acesso negado" };
      }
      if (e.message.includes('CallbackRouteError')) {
        return { success: false, message: "Erro durante o processo de login" };
      }
      
      return { success: false, message: e.message || "Ops, algum erro aconteceu!" };
    }
    
    console.error(e);
    return { success: false, message: "Ops, algum erro aconteceu!" };
  }
}
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { signIn } from "../../../../auth";
import db from "@/lib/db";

export default async function loginAction(_prevState: any, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    // Verifica se o usuário já completou o onboarding
    const user = await db.usuario.findUnique({
      where: { email: formData.get("email") as string },
    });

    return { success: true, message: "Login realizado com sucesso!" };
  } catch (e: any) {
    if (e.type === "CredentialsSignin") {
      return { success: false, message: "Dados de login incorretos" };
    }
    console.error(e);
    return { success: false, message: "Ops, algum erro aconteceu!" };
  }
}
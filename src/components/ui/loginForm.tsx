"use client";

import loginAction from "@/app/(auth)/login/loginAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Form from "next/form";
import { useActionState } from "react";
import { Toaster, toast } from "sonner";
import { useState, useEffect } from "react";
import { Icons } from "./loadingSpinner";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [hasShownToast, setHasShownToast] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state && !hasShownToast) {
      if (state.success === false) {
        toast.error(state.message);
        setHasShownToast(true);
      } else if (state.success === true) {
        toast.success(state.message);
        setHasShownToast(true);

        // Aguarda um tempo para mostrar o toast e depois redireciona
        setTimeout(() => {
          window.location.reload(); // Recarrega a página como um F5
        }, 1500);
      }
    }
  }, [state, hasShownToast, router]);

  useEffect(() => {
    if (!isPending) {
      setHasShownToast(false);
    }
  }, [isPending]);

  return (
    <>
      <Form action={formAction}>
        <div>
          <Label>Email</Label>
          <Input type="email" name="email" placeholder="eu@exemplo.com" />
        </div>
        <div>
          <Label>Senha</Label>
          <Input type="password" name="password" placeholder="********" />
        </div>
        <div>
          <Button className="w-full mt-6 hover:bg-blue-400/85 bg-blue-400" type="submit">
            {isPending ? (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            ) : (
              <p>Login</p>
            )}
          </Button>
        </div>
      </Form>
    </>
  );
}

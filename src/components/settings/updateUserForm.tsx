"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import updateUserName from "@/app/settings/updateUserNameAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface UpdateUserNameFormProps {
  userName: string;
  userEmail: string; 
}

export default function UpdateUserNameForm({
  userName,
  userEmail, // Receba o email como prop
}: UpdateUserNameFormProps) {
  const [name, setName] = useState(userName || "");
  const [isLoading, setIsLoading] = useState(false);
  const { update } = useSession();
  const { data: session } = useSession();



  if (session?.user?.image) {
    console.log("Imagem do usuário:", session.user.image);
  } else {
    console.log("Usuário não tem imagem ou image é null/undefined");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return; // Use userEmail em vez de userId

    setIsLoading(true);

    try {
      // Atualiza o nome do usuário
      const nameResult = await updateUserName(userEmail, name); // Passa userEmail
      if (!nameResult.success) {
        throw new Error(nameResult.message);
      }

      // Atualiza a sessão do NextAuth com o novo nome e imagem
      await update({
        name,
      });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao atualizar o perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Digite seu nome"
          required
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </form>
  );
}
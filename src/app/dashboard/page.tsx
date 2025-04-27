// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Carregando...</div>;
  }

  if (!session) {
    return <div>Não autenticado</div>;
  }

  console.log("Sessão no dashboard:", session);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U"; // Fallback caso não haja nome
    const nameParts = name.split(" ");
    return nameParts
      .map((part) => part[0]) // Pega a primeira letra de cada parte
      .join("") // Junta as letras
      .toUpperCase(); // Converte para maiúsculas
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>
       {/*  Bem-vindo, {session.user?.name} {session.user.id} */}
      </p>
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={session?.user?.image || ""} // Exibe a imagem do usuário, se houver
          alt={session?.user?.name || "Usuário"} // Alt text para acessibilidade
        />
      </Avatar>
    </div>
  );
}

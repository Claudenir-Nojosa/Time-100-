// components/BotaoGoogleClient.tsx
"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "../ui/button";

export default function BotaoGoogleClient() {
  return (
    <div className="flex items-center justify-center">
      <Button
        onClick={() => signIn("google")} // Remove o redirectTo
        variant={"outline"}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-slate-600 shadow-md"
      >
        <Image src="/google.svg" alt="Google" height={25} width={25} />
        <p className="text-sm font-medium">Continue com Google</p>
      </Button>
    </div>
  );
}
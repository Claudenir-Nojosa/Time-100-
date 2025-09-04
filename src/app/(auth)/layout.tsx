import Navbar from "@/components/shared/navbar";
import { Handshake, Loader, Plane, Server } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center py-40">
      <Link href={"/"}>
       <Server className="text-emerald-600 animate-pulse" />
      </Link>
      {children}
    </section>
  );
}

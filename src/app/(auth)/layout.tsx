import Navbar from "@/components/shared/navbar";
import { Handshake, Loader, Plane } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center py-40">
      <Link href={"/"}>
       <Loader className="text-fuchsia-400 animate-pulse" />
      </Link>
      {children}
    </section>
  );
}

import Sidebar from "@/components/shared/sideBar";
import { ThemeToggle } from "@/components/shared/themeToggle";
import { SessionProvider } from "next-auth/react";
import React from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen">
      <SessionProvider>
        <div className="flex flex-1 overflow-hidden">
          <ThemeToggle />
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
      </SessionProvider>
    </div>
  );
};

export default DashboardLayout;

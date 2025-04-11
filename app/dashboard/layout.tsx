"use client";

import React from "react";
import { WalletProvider } from "../context/WalletContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <WalletProvider>{children}</WalletProvider>;
}

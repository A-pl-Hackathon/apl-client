"use client";

import React from "react";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import Card from "../components/Card";
import UserDataCard from "../components/UserDataCard";
import NetworkStatus from "../components/NetworkStatus";
import { useWallet } from "../context/WalletContext";

export default function Dashboard() {
  const { account } = useWallet();

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Network Status Section 
        <NetworkStatus />*/}
      </div>

      <UserDataCard
        walletAddress={account || ""}
        formatAccount={(address) =>
          `${address.substring(0, 10)}...${address.substring(
            address.length - 4
          )}`
        }
      />
    </DashboardLayout>
  );
}

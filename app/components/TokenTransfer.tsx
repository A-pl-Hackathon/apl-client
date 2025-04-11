"use client";

import React, { useState, useEffect } from "react";
import {
  BrowserProvider,
  Contract,
  parseUnits,
  isAddress,
  formatUnits,
} from "ethers";

import tokenABI from "../contracts/abi.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface TransactionStatus {
  hash: string;
  status:
    | "pending_confirmation"
    | "pending_receipt"
    | "pending"
    | "success"
    | "failed"
    | "error"
    | "";
}

const TokenTransfer: React.FC = () => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [decimals] = useState<number>(18);
  const [tokenSymbol] = useState<string>("MTK");

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const [transaction, setTransaction] = useState<TransactionStatus>({
    hash: "",
    status: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshingBalance, setRefreshingBalance] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const connectWallet = async () => {
    setError("");

    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const web3Provider = new BrowserProvider(window.ethereum, "any");

        await web3Provider.send("eth_requestAccounts", []);
        const web3Signer = await web3Provider.getSigner();
        const currentAccount = await web3Signer.getAddress();

        const { chainId } = await web3Provider.getNetwork();

        if (Number(chainId) !== 11155111) {
          setError("Please connect to the Sepolia Test Network in MetaMask.");
          return;
        }

        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(currentAccount);

        const tokenContract = new Contract(
          contractAddress,
          tokenABI,
          web3Signer
        );
        setContract(tokenContract);

        console.log("Wallet connected:", currentAccount);
        console.log("Contract loaded at:", contractAddress);
        console.log("Using hardcoded token decimals:", decimals);
        console.log("Using hardcoded token symbol:", tokenSymbol);
      } catch (err: any) {
        console.error("Wallet connection failed:", err);
        setError(err.message || "Failed to connect wallet.");
      }
    } else {
      setError("MetaMask is not installed. Please install it to use this app.");
    }
  };

  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length > 0) {
        setAccount(accounts[0]);

        if (typeof window !== "undefined" && window.ethereum) {
          try {
            const web3Provider = new BrowserProvider(window.ethereum, "any");
            const web3Signer = await web3Provider.getSigner();
            const newAddress = await web3Signer.getAddress();
            setAccount(newAddress);
            setSigner(web3Signer);

            const tokenContract = new Contract(
              contractAddress,
              tokenABI,
              web3Signer
            );
            setContract(tokenContract);
            console.log(
              "Re-initialized provider, signer, and contract for new account."
            );
          } catch (error: any) {
            console.error("Error re-initializing after account change:", error);
            setError(
              "Failed to update for new account. Please refresh or reconnect."
            );
            setAccount(null);
            setSigner(null);
            setContract(null);
          }
        }
      } else {
        setAccount(null);
        setSigner(null);
        setContract(null);
        setError("Wallet disconnected. Please connect again.");
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log("Network changed:", chainId);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    };

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum?.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [contractAddress]);

  const handleTransferWithoutBackend = async () => {
    if (!contract || !signer || !recipient || !amount) {
      setError("Please connect your wallet and fill in all fields.");
      return;
    }
    if (!isAddress(recipient)) {
      setError("Invalid recipient address.");
      return;
    }

    setLoading(true);
    setError("");
    setTransaction({
      hash: "",
      status: "",
    });

    try {
      const amountToSend = parseUnits(amount, decimals);
      console.log(`Sending ${amount} ${tokenSymbol} tokens to ${recipient}`);

      const tx = await contract.transfer(recipient, amountToSend);
      setTransaction({
        hash: tx.hash,
        status: "pending_confirmation",
      });

      setTransaction((prev) => ({ ...prev, status: "pending_receipt" }));
      const receipt = await tx.wait();

      setTransaction((prev) => ({ ...prev, status: "success" }));
      setLoading(false);

      refreshBalance();

      setAmount("");
      setRecipient("");
    } catch (err: any) {
      console.error("Transaction failed:", err);
      setError(err.reason || err.message || "Transaction failed.");
      setTransaction((prev) => ({ ...prev, status: "error" }));
      setLoading(false);
    }
  };

  const getTokenBalance = async () => {
    if (!contract || !account) return "0";

    try {
      const balance = await contract.balanceOf(account);
      return formatUnits(balance, decimals);
    } catch (error) {
      console.error("Failed to get token balance:", error);
      return "0";
    }
  };

  const [tokenBalance, setTokenBalance] = useState<string>("0");

  const refreshBalance = async () => {
    if (!contract || !account) return;

    try {
      setRefreshingBalance(true);
      const balance = await getTokenBalance();
      setTokenBalance(balance);
    } catch (error) {
      console.error("Error refreshing balance:", error);
    } finally {
      setRefreshingBalance(false);
    }
  };

  const setMaxAmount = () => {
    setAmount(tokenBalance);
  };

  useEffect(() => {
    if (contract && account) {
      refreshBalance();
    }
  }, [contract, account]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center text-black">
        {tokenSymbol} Token Transfer
      </h1>

      {!account ? (
        <button
          onClick={connectWallet}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Connect MetaMask
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Connected: {account.substring(0, 6)}...
              {account.substring(account.length - 4)}
            </p>
            <button
              onClick={refreshBalance}
              disabled={refreshingBalance}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              {refreshingBalance ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-black">Token: {tokenSymbol}</p>
            <p className="text-sm font-medium text-black">
              Balance: {tokenBalance} {tokenSymbol}
            </p>
          </div>

          <div className="space-y-3 text-black">
            <input
              type="text"
              placeholder="Recipient Address (0x...)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="relative">
              <input
                type="text"
                placeholder={`Amount (e.g., 1.23)`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={setMaxAmount}
                disabled={loading || tokenBalance === "0"}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded"
              >
                Max
              </button>
            </div>

            <button
              onClick={handleTransferWithoutBackend}
              disabled={loading || !recipient || !amount}
              className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Send Tokens"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">Error: {error}</p>}

      {transaction.hash && (
        <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
          <p className="text-sm">
            Transaction Hash:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {transaction.hash.substring(0, 10)}...
              {transaction.hash.substring(transaction.hash.length - 8)}
            </a>
          </p>
          <p className="text-sm mt-1">
            Status:{" "}
            <span
              className={`font-medium ${
                transaction.status === "success"
                  ? "text-green-600"
                  : transaction.status === "error" ||
                    transaction.status === "failed"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {transaction.status === "pending_confirmation"
                ? "Waiting for confirmation"
                : transaction.status === "pending_receipt"
                ? "Waiting for receipt"
                : transaction.status === "success"
                ? "Success"
                : transaction.status === "error" ||
                  transaction.status === "failed"
                ? "Failed"
                : transaction.status || "Initializing..."}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenTransfer;

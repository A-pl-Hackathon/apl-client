"use client";

import React, { useState, useEffect } from "react";
import {
  BrowserProvider,
  Contract,
  parseUnits,
  isAddress,
  formatUnits,
} from "ethers";
import { useWallet } from "../context/WalletContext";
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
  const {
    selectedNetwork,
    toggleNetwork,
    connectWallet: contextConnectWallet,
    account: walletAccount,
    tokenSymbol: walletTokenSymbol,
  } = useWallet();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number>(18);
  const [tokenSymbol, setTokenSymbol] = useState<string>("AGP");
  const [aggTokenBalance, setAggTokenBalance] = useState<string>("0");

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
  const sepoliaContractAddress =
    process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS || "";
  const sagaContractAddress =
    process.env.NEXT_PUBLIC_SAGA_CONTRACT_ADDRESS ||
    sepoliaContractAddress ||
    contractAddress;
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Network chain IDs
  const SEPOLIA_CHAIN_ID = 11155111;
  const SAGA_CHAIN_ID = 2744440729579000;

  const getChainIdForNetwork = (network: "sepolia" | "saga") => {
    return network === "sepolia" ? SEPOLIA_CHAIN_ID : SAGA_CHAIN_ID;
  };

  const getContractAddressForNetwork = (network: "sepolia" | "saga") => {
    return network === "sepolia" ? sepoliaContractAddress : sagaContractAddress;
  };

  const getNetworkNameByChainId = (chainId: number) => {
    if (chainId === SEPOLIA_CHAIN_ID) return "sepolia";
    if (chainId === SAGA_CHAIN_ID) return "saga";
    return null;
  };

  const connectWallet = async () => {
    setError("");
    try {
      await contextConnectWallet();
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "Failed to connect wallet.");
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

            initializeContract(web3Signer);
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

      if (typeof window !== "undefined" && window.ethereum) {
        initializeContract();
      }
    };

    const initializeContract = async (signerToUse?: any) => {
      if (!window.ethereum) return;

      try {
        const web3Provider = new BrowserProvider(window.ethereum, "any");
        const web3Signer = signerToUse || (await web3Provider.getSigner());
        const currentSigner = signerToUse || web3Signer;

        setSigner(currentSigner);
        setProvider(web3Provider);

        const addressToUse = getContractAddressForNetwork(selectedNetwork);
        console.log("Initializing contract at address:", addressToUse);

        const tokenContract = new Contract(
          addressToUse,
          tokenABI,
          currentSigner
        );
        setContract(tokenContract);

        try {
          const symbol = await tokenContract.symbol();
          setTokenSymbol(symbol);
          console.log("Token symbol initialized:", symbol);

          const tokenDecimals = await tokenContract.decimals();
          setDecimals(tokenDecimals);
          console.log("Token decimals initialized:", tokenDecimals);
        } catch (error) {
          console.error("Error getting token info:", error);
        }
      } catch (error) {
        console.error("Failed to initialize contract:", error);
      }
    };

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    if (account && selectedNetwork) {
      initializeContract();
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
  }, [selectedNetwork]);

  useEffect(() => {
    if (walletAccount) {
      setAccount(walletAccount);
    }

    if (walletTokenSymbol) {
      setTokenSymbol(walletTokenSymbol);
    }
  }, [walletAccount, walletTokenSymbol]);

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
      const cleanAmount = stripCommas(amount);
      const amountToSend = parseUnits(cleanAmount, decimals);
      console.log(
        `Sending ${cleanAmount} ${tokenSymbol} tokens to ${recipient}`
      );
      console.log(`Amount in smallest unit: ${amountToSend}`);

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
      try {
        const tokenDecimals = await contract.decimals();
        console.log("Token decimals:", tokenDecimals);
        setDecimals(tokenDecimals);
      } catch (decimalError) {
        console.error(
          "Error getting decimals, using default 18:",
          decimalError
        );
      }

      const balance = await contract.balanceOf(account);
      console.log("Raw balance:", balance.toString());

      let divisor = BigInt(1);
      for (let i = 0; i < decimals; i++) {
        divisor *= BigInt(10);
      }

      const whole = balance / divisor;
      const fraction = balance % divisor;

      let formattedWhole = whole
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      let formatted = formattedWhole;

      if (fraction > 0) {
        let fractionStr = fraction.toString().padStart(decimals, "0");
        fractionStr = fractionStr.replace(/0+$/, "");

        if (fractionStr.length > 0) {
          formatted += "." + fractionStr;
        }
      }

      console.log("Formatted balance:", formatted);
      return formatted;
    } catch (error) {
      console.error("Failed to get token balance:", error);
      return "0";
    }
  };

  const [tokenBalance, setTokenBalance] = useState<string>("0");

  const getNetworkDisplayName = (network: "sepolia" | "saga") => {
    return network === "sepolia" ? "Sepolia" : "testagp_SAGA";
  };

  const getAggTokenBalance = async () => {
    if (!account || selectedNetwork !== "saga" || !signer) return "0";

    try {
      const aggTokenAddress = process.env.NEXT_PUBLIC_AGG_TOKEN_ADDRESS || "";

      if (!aggTokenAddress) {
        try {
          const balance = await provider?.getBalance(account);
          if (!balance) return "0";

          const formattedBalance = formatUnits(balance, 18);
          const parts = formattedBalance.split(".");

          const wholeWithCommas = parts[0].replace(
            /\B(?=(\d{3})+(?!\d))/g,
            ","
          );

          if (parts.length > 1) {
            const decimals = parts[1].replace(/0+$/, "");
            return decimals.length > 0
              ? `${wholeWithCommas}.${decimals}`
              : wholeWithCommas;
          }

          return wholeWithCommas;
        } catch (error) {
          console.error("Failed to get native AGG balance:", error);
          return "0";
        }
      }

      const aggTokenContract = new Contract(aggTokenAddress, tokenABI, signer);

      let decimals = 18;
      try {
        decimals = await aggTokenContract.decimals();
      } catch (error) {
        console.error("Error getting AGG decimals, using default 18:", error);
      }

      const balance = await aggTokenContract.balanceOf(account);

      let divisor = BigInt(1);
      for (let i = 0; i < decimals; i++) {
        divisor *= BigInt(10);
      }

      const whole = balance / divisor;
      const fraction = balance % divisor;

      let formattedWhole = whole
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      let formatted = formattedWhole;

      if (fraction > 0) {
        let fractionStr = fraction.toString().padStart(decimals, "0");
        fractionStr = fractionStr.replace(/0+$/, "");

        if (fractionStr.length > 0) {
          formatted += "." + fractionStr;
        }
      }

      return formatted;
    } catch (error) {
      console.error("Failed to get AGG token balance:", error);
      return "0";
    }
  };

  const refreshBalance = async () => {
    if (!contract || !account) return;

    try {
      setRefreshingBalance(true);
      const balance = await getTokenBalance();
      setTokenBalance(balance);

      if (selectedNetwork === "saga") {
        const aggBalance = await getAggTokenBalance();
        setAggTokenBalance(aggBalance);
      } else {
        setAggTokenBalance("0");
      }
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
  }, [contract, account, selectedNetwork]);

  const formatNumberWithCommas = (value: string): string => {
    const withoutCommas = value.replace(/,/g, "");

    const parts = withoutCommas.split(".");

    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return parts.length > 1 ? parts.join(".") : parts[0];
  };

  const stripCommas = (value: string): string => {
    return value.replace(/,/g, "");
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="max-w-lg mx-auto p-4 bg-white rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Token Transfer</h1>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Network: {getNetworkDisplayName(selectedNetwork)}
            </span>
            <button
              onClick={toggleNetwork}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition"
              disabled={loading}
            >
              Switch to{" "}
              {selectedNetwork === "sepolia" ? "testagp_SAGA" : "Sepolia"}
            </button>
          </div>
        </div>

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
              <p className="text-sm text-black">
                {selectedNetwork === "saga" ? "Contract Token: " : "Token: "}
                {tokenSymbol}
              </p>
              <p className="text-sm font-medium text-black">
                Balance: {tokenBalance} {tokenSymbol}
              </p>
            </div>

            {selectedNetwork === "saga" && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-black">Native Token: AGG</p>
                <p className="text-sm font-medium text-black">
                  Balance: {aggTokenBalance} AGG
                </p>
              </div>
            )}

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
                  placeholder="Amount (e.g., 1.23)"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const withoutCommas = value.replace(/,/g, "");
                    const isValidInput =
                      /^(\d+)?\.?(\d+)?$/.test(withoutCommas) ||
                      withoutCommas === "";

                    if (isValidInput) {
                      const formattedValue =
                        formatNumberWithCommas(withoutCommas);
                      setAmount(formattedValue);
                    }
                  }}
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
                href={`${
                  selectedNetwork === "sepolia"
                    ? "https://sepolia.etherscan.io/tx/"
                    : "https://explorer.sagachain.org/tx/"
                }${transaction.hash}`}
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
    </div>
  );
};

export default TokenTransfer;

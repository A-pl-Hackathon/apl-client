"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { BrowserProvider, Contract } from "ethers";
import tokenABI from "../contracts/abi.json";

interface WalletContextType {
  account: string | null;
  connecting: boolean;
  tokenBalance: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [connecting, setConnecting] = useState<boolean>(false);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask is not installed. Please install it to use this app.");
      return;
    }

    try {
      setConnecting(true);
      const web3Provider = new BrowserProvider(window.ethereum, "any");

      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      const currentAccount = await web3Signer.getAddress();

      const { chainId } = await web3Provider.getNetwork();
      if (Number(chainId) !== 11155111) {
        alert("Please connect to the Sepolia Test Network in MetaMask.");
        setConnecting(false);
        return;
      }

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(currentAccount);

      const tokenContract = new Contract(contractAddress, tokenABI, web3Signer);
      setContract(tokenContract);

      console.log("Wallet connected:", currentAccount);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setContract(null);
    setTokenBalance("0");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (account !== accounts[0]) {
        setAccount(accounts[0]);

        if (window.ethereum) {
          try {
            const web3Provider = new BrowserProvider(window.ethereum, "any");
            const web3Signer = await web3Provider.getSigner();
            setSigner(web3Signer);

            const tokenContract = new Contract(
              contractAddress,
              tokenABI,
              web3Signer
            );
            setContract(tokenContract);
          } catch (error) {
            console.error("Error updating account:", error);
            disconnectWallet();
          }
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [account, contractAddress]);

  useEffect(() => {
    const getTokenBalance = async () => {
      if (!contract || !account) return;

      try {
        const balance = await contract.balanceOf(account);
        const formattedBalance = balance / BigInt(10 ** 18);
        setTokenBalance(formattedBalance.toString());
      } catch (error) {
        console.error("Failed to get token balance:", error);
      }
    };

    if (contract && account) {
      getTokenBalance();
    }
  }, [contract, account]);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          connectWallet();
        }
      } catch (error) {
        console.error("Error checking existing connection:", error);
      }
    };

    checkConnection();
  }, []);

  const value = {
    account,
    connecting,
    tokenBalance,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export default WalletContext;

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
  tokenSymbol: string;
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
  const [tokenSymbol, setTokenSymbol] = useState<string>("AGP");
  const [connecting, setConnecting] = useState<boolean>(false);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  const sepoliaContractAddress =
    process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS || "";

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
      console.log("Connected to chain ID:", Number(chainId));

      if (Number(chainId) !== 11155111) {
        alert("Please connect to the Sepolia Test Network in MetaMask.");
        setConnecting(false);
        return;
      }

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(currentAccount);

      const addressToUse = sepoliaContractAddress || contractAddress;
      console.log("Using contract address:", addressToUse);
      console.log("NEXT_PUBLIC_CONTRACT_ADDRESS:", contractAddress);
      console.log(
        "NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS:",
        sepoliaContractAddress
      );

      const tokenContract = new Contract(addressToUse, tokenABI, web3Signer);
      setContract(tokenContract);

      try {
        const symbol = await tokenContract.symbol();
        console.log("Token symbol retrieved from contract:", symbol);
        setTokenSymbol(symbol);
      } catch (error) {
        console.error("Error fetching token symbol:", error);
        setTokenSymbol("AGP");
      }

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

            const addressToUse = sepoliaContractAddress || contractAddress;
            console.log(
              "Using contract address after account change:",
              addressToUse
            );

            const tokenContract = new Contract(
              addressToUse,
              tokenABI,
              web3Signer
            );
            setContract(tokenContract);

            try {
              const symbol = await tokenContract.symbol();
              console.log(
                "Token symbol retrieved after account change:",
                symbol
              );
              setTokenSymbol(symbol);
            } catch (error) {
              console.error(
                "Error fetching token symbol after account change:",
                error
              );
            }
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
  }, [account, contractAddress, sepoliaContractAddress]);

  useEffect(() => {
    const getTokenBalance = async () => {
      if (!contract || !account) return;

      try {
        console.log("Retrieving token balance for account:", account);

        let decimals = 18;
        try {
          decimals = await contract.decimals();
          console.log("Token decimals:", decimals);
        } catch (error) {
          console.error(
            "Error getting token decimals, using default 18:",
            error
          );
        }

        const balance = await contract.balanceOf(account);
        console.log("Raw balance from contract:", balance.toString());

        let divisor = BigInt(1);
        for (let i = 0; i < decimals; i++) {
          divisor *= BigInt(10);
        }

        const whole = balance / divisor;
        const fraction = balance % divisor;

        let formattedWhole = whole
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        let formattedBalance = formattedWhole;

        if (fraction > 0) {
          let fractionStr = fraction.toString().padStart(decimals, "0");
          fractionStr = fractionStr.replace(/0+$/, "");

          if (fractionStr.length > 0) {
            formattedBalance += "." + fractionStr;
          }
        }

        console.log("Formatted balance:", formattedBalance);
        setTokenBalance(formattedBalance);
      } catch (error) {
        console.error("Failed to get token balance:", error);
      }
    };

    if (contract && account) {
      getTokenBalance();
    }
  }, [contract, account]);

  const value = {
    account,
    connecting,
    tokenBalance,
    tokenSymbol,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export default WalletContext;

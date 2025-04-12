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
  selectedNetwork: "sepolia" | "saga";
  toggleNetwork: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
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
  const [selectedNetwork, setSelectedNetwork] = useState<"sepolia" | "saga">(
    "sepolia"
  );

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  const sepoliaContractAddress =
    process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS || "";
  const sagaContractAddress =
    process.env.NEXT_PUBLIC_SAGA_CONTRACT_ADDRESS ||
    sepoliaContractAddress ||
    contractAddress;

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

  const getNetworkDisplayName = (network: "sepolia" | "saga") => {
    return network === "sepolia" ? "Sepolia" : "testagp_SAGA";
  };

  const toggleNetwork = async () => {
    const newNetwork = selectedNetwork === "sepolia" ? "saga" : "sepolia";
    setSelectedNetwork(newNetwork);

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedNetwork", newNetwork);
    }

    if (provider && window.ethereum) {
      try {
        const targetChainId = getChainIdForNetwork(newNetwork);
        const chainIdHex = `0x${targetChainId.toString(16)}`;

        console.log(
          `Attempting to switch to ${newNetwork} network (chainId: ${chainIdHex})`
        );

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });

        console.log(`Network switch to ${newNetwork} initiated`);
      } catch (switchError: any) {
        console.error("Error switching network:", switchError);

        if (switchError.code === 4902 && newNetwork === "saga") {
          try {
            console.log("Attempting to add SAGA network to wallet");
            await addNetworkToMetaMask("saga");
          } catch (addError) {
            console.error("Failed to add network:", addError);
            setSelectedNetwork(selectedNetwork);
            alert("Failed to add network to wallet. Please add it manually.");
          }
        } else {
          setSelectedNetwork(selectedNetwork);
          console.log(
            "Network switch rejected or failed, reverting to",
            selectedNetwork
          );
        }
      }
    } else {
      console.log(
        `Changed selected network to ${newNetwork} (disconnected state)`
      );
    }
  };

  const addNetworkToMetaMask = async (network: "sepolia" | "saga") => {
    if (!window.ethereum) return;

    if (network === "saga") {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${SAGA_CHAIN_ID.toString(16)}`,
            chainName: "testagp_SAGA",
            nativeCurrency: {
              name: "AGG",
              symbol: "AGG",
              decimals: 18,
            },
            rpcUrls: ["https://mainnet.sagachain.org"], // SAGA RPC URL
            blockExplorerUrls: ["https://explorer.sagachain.org"], // SAGA Explorer URL
          },
        ],
      });
    }
  };

  const connectWallet = async (showErrors = true) => {
    if (typeof window === "undefined" || !window.ethereum) {
      if (showErrors) {
        alert("MetaMask is not installed. Please install it to use this app.");
      }
      return;
    }

    try {
      setConnecting(true);
      const web3Provider = new BrowserProvider(window.ethereum, "any");

      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      const currentAccount = await web3Signer.getAddress();

      localStorage.setItem("walletAddress", currentAccount);

      const { chainId } = await web3Provider.getNetwork();
      console.log("Connected to chain ID:", Number(chainId));

      const currentChainId = Number(chainId);
      const targetChainId = getChainIdForNetwork(selectedNetwork);

      const detectedNetwork = getNetworkNameByChainId(currentChainId);
      if (detectedNetwork) {
        setSelectedNetwork(detectedNetwork);
        localStorage.setItem("selectedNetwork", detectedNetwork);
      }

      // Set provider, signer, and account regardless of network
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(currentAccount);

      // Use the current network address, not the selected network
      const networkToUse = detectedNetwork || selectedNetwork;
      const addressToUse = getContractAddressForNetwork(networkToUse);

      console.log("Using contract address:", addressToUse);
      console.log("NEXT_PUBLIC_CONTRACT_ADDRESS:", contractAddress);
      console.log(
        "NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS:",
        sepoliaContractAddress
      );
      console.log("NEXT_PUBLIC_SAGA_CONTRACT_ADDRESS:", sagaContractAddress);

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
      if (showErrors) {
        alert("Failed to connect wallet. Please try again.");
      }
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

    // Clear wallet from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletAddress");
    }
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

            const addressToUse = getContractAddressForNetwork(selectedNetwork);
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

    const handleChainChanged = (chainId: string) => {
      console.log("Chain changed to:", chainId);
      if (!chainId) return;

      const numericChainId = parseInt(chainId, 16);
      const detectedNetwork = getNetworkNameByChainId(numericChainId);

      if (detectedNetwork) {
        setSelectedNetwork(detectedNetwork);
        if (typeof window !== "undefined") {
          localStorage.setItem("selectedNetwork", detectedNetwork);
        }
        console.log(`Updated network state to: ${detectedNetwork}`);

        if (account && window.ethereum) {
          connectWallet(false);
        }
      } else {
        console.warn(
          `Unknown chain ID: ${chainId}, keeping current network state: ${selectedNetwork}`
        );
      }
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
  }, [account, selectedNetwork]);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNetwork = localStorage.getItem("selectedNetwork");
      if (savedNetwork === "saga" || savedNetwork === "sepolia") {
        setSelectedNetwork(savedNetwork);
      }

      const savedAccount = localStorage.getItem("walletAddress");
      if (savedAccount && window.ethereum) {
        console.log("Attempting to reconnect saved wallet:", savedAccount);
        connectWallet(false);
      }
    }
  }, []);

  const value = {
    account,
    connecting,
    tokenBalance,
    tokenSymbol,
    selectedNetwork,
    toggleNetwork,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export default WalletContext;

import { ethers } from "ethers";

const AGPgenABI = [
  {
    inputs: [{ name: "delegateAddress", type: "address" }],
    name: "authorizeDelegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const getContractAddress = (network: string) => {
  switch (network) {
    case "sepolia":
      return (
        process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS ||
        "0x123456789abcdef123456789abcdef123456789a"
      );
    default:
      return null;
  }
};

export async function authorizeDelegate(
  delegateAddress: string
): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    let contractAddress;
    if (chainId === 11155111) {
      contractAddress = getContractAddress("sepolia");
      if (!contractAddress) {
        throw new Error("Contract address not configured for Sepolia network");
      }
    } else {
      throw new Error(
        "Unsupported network. Please connect to Sepolia testnet."
      );
    }

    const contract = new ethers.Contract(contractAddress, AGPgenABI, signer);

    const tx = await contract.authorizeDelegate(delegateAddress);
    await tx.wait();

    return true;
  } catch (error) {
    console.error("Error authorizing delegate:", error);
    throw error;
  }
}

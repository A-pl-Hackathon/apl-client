import TokenTransfer from "../components/TokenTransfer";

export default function TokensPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Token Management</h1>
      <TokenTransfer />
    </div>
  );
}

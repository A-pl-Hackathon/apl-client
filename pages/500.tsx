import Link from "next/link";

export default function Custom500() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#000",
        color: "#fff",
        padding: "0 20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        500 - Server Error
      </h1>
      <p style={{ marginBottom: "2rem" }}>
        An unexpected error occurred on the server.
      </p>
      <Link
        href="/"
        style={{
          background: "#0070f3",
          color: "#fff",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.375rem",
          textDecoration: "none",
        }}
      >
        Return to Home
      </Link>
    </div>
  );
}

import { NextPageContext } from "next";

interface ErrorProps {
  statusCode: number;
}

function Error({ statusCode }: ErrorProps) {
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
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : "An error occurred on client"}
      </h1>
      <p>Please try again later or return to the homepage.</p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode ?? 500 : 404;
  return { statusCode };
};

export default Error;

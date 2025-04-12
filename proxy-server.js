const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(
  cors({
    origin: "*", // Allow any origin to access
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON request bodies
app.use(bodyParser.json());

// Forward requests to external API
app.post("/api/user-data", async (req, res) => {
  console.log("Proxy received request:", JSON.stringify(req.body));

  try {
    // Forward to the external API
    const response = await axios.post(
      "https://api-dashboard.a-pl.xyz/user-data/",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Proxy received response:", response.data);

    // Return the external API response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Proxy error:", error.message);

    // Try alternative URL with port 8080
    try {
      console.log("Trying alternative URL with port 8080");
      const altResponse = await axios.post(
        "https://api-dashboard.a-pl.xyz:8080/user-data/",
        req.body,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Alternative URL response:", altResponse.data);

      // Return the alternative response
      res.status(altResponse.status).json(altResponse.data);
    } catch (altError) {
      console.error("Alternative proxy error:", altError.message);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        res.status(error.response.status).json({
          error: `External API responded with ${error.response.status}`,
          details: error.response.data,
        });
      } else {
        // Something happened in setting up the request
        res.status(500).json({
          error: "Failed to connect to external API",
          message: error.message,
        });
      }
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log("Send requests to http://localhost:3001/api/user-data");
});

// const express = require("express");
// const axios = require("axios");
// const crypto = require("crypto");
// const qs = require("qs");

// const router = express.Router();

// // 🔥 GET TOKEN
// // const qs = require("qs");

// const getAccessToken = async () => {
//   const response = await axios.post(
//     "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
//     qs.stringify({
//       client_id: process.env.PHONE_PE_CLIENT_ID,
//       client_version:"1",
//       client_secret: process.env.PHONE_PE_CLIENT_SECRET_KEY,
//       grant_type: "client_credentials",
//     }),
//     {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     },
//   );
//   console.log("response", response);

//   return response.data.access_token;
// };

// // 🔥 CREATE PAYMENT
// router.post("/create-payment", async (req, res) => {
//   try {
//     // 🔥 STEP 1: Get Token
//     const tokenRes = await axios.post(
//       "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
//       new URLSearchParams({
//         client_id: process.env.PHONE_PE_CLIENT_ID,
//         client_version: "1",
//         client_secret: process.env.PHONE_PE_CLIENT_SECRET_KEY,
//         grant_type: "client_credentials",
//       }),
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//       },
//     );

//     const token = tokenRes.data.access_token;

//     // 🔥 STEP 2: Create Payment
//     const response = await axios.post(
//       "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
//       {
//         merchantOrderId: "ORDER_" + Date.now(),
//         amount: 3900,
//         expireAfter: 1200,
//         metaInfo: {
//           udf1: "demo",
//         },
//         paymentFlow: {
//           type: "PG_CHECKOUT",
//           merchantUrls: {
//             // redirectUrl: "http://localhost:3001/powershell/payment-success",
//             redirectUrl:
//               "https://neeltechnologies.net/powershell/payment-success",
//           },
//         },
//       },
//       {
//         headers: {
//           Authorization: `O-Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     const redirectUrl = response.data.redirectUrl;

//     res.json({ redirectUrl });
//   } catch (error) {
//     console.error("Payment Error:", error.response?.data || error.message);
//     res.status(500).json({ message: "Payment failed" });
//   }
// });

// module.exports = router;

const express = require("express");
const axios = require("axios");
const qs = require("qs");

const router = express.Router();

// 🔥 GET TOKEN (PRODUCTION)
const getAccessToken = async () => {
  const response = await axios.post(
    "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
    qs.stringify({
      client_id: process.env.PHONE_PE_CLIENT_ID,
      client_version: "1",
      client_secret: process.env.PHONE_PE_CLIENT_SECRET_KEY,
      grant_type: "client_credentials",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return response.data.access_token;
};

// 🔥 CREATE PAYMENT (PRODUCTION)
router.post("/create-payment", async (req, res) => {
  try {
    const token = await getAccessToken();

    const merchantOrderId = "ORDER_" + Date.now();

    const response = await axios.post(
      "https://api.phonepe.com/apis/pg/checkout/v2/pay", // ✅ LIVE
      {
        merchantOrderId,
        // amount: 3900,
        amount: 100,
        expireAfter: 1200,
        metaInfo: {
          udf1: "demo",
        },
        paymentFlow: {
          type: "PG_CHECKOUT",
          merchantUrls: {
            redirectUrl:
              "https://neeltechnologies.net/powershell/payment-success",
          },
        },
      },
      {
        headers: {
          Authorization: `O-Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const redirectUrl = response.data.redirectUrl;

    res.json({
      redirectUrl,
      orderId: merchantOrderId, // 🔥 IMPORTANT for verification
    });
  } catch (error) {
    console.error("Payment Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Payment failed" });
  }
});

module.exports = router;

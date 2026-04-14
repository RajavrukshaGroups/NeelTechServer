const dotenv = require("dotenv");
dotenv.config(); // ✅ MUST BE FIRST
const express = require("express");
const axios = require("axios");
const Payment = require("../Models/payment");
const qs = require("qs");

const router = express.Router();

router.post("/create-payment", async (req, res) => {
  try {
    // STEP 1: Generate Order ID
    const orderId = "ORDER_" + Date.now();

    // STEP 2: Save in DB
    await Payment.create({
      orderId,
      status: "PENDING",
    });

    // STEP 3: Get token
    const tokenRes = await axios.post(
      // "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
      //   "https://api.phonepe.com/apis/pg/v1/oauth/token",
      "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
      //   new URLSearchParams({
      //     client_id: process.env.PHONE_PE_CLIENT_ID,
      //     client_version: "1",
      //     client_secret: process.env.PHONE_PE_CLIENT_SECRET_KEY,
      //     grant_type: "client_credentials",
      //   }),
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

    const token = tokenRes.data.access_token;

    // STEP 4: Create payment
    const response = await axios.post(
      // "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay",
      "https://api.phonepe.com/apis/pg/checkout/v2/pay",
      {
        merchantOrderId: orderId,
        // amount: 3900,
        amount: 100,
        paymentFlow: {
          type: "PG_CHECKOUT",
          merchantUrls: {
            // redirectUrl:
            //   "http://localhost:3001/powershell/payment-success",
            redirectUrl:
              "https://neeltechnologies.com/powershell/payment-success",
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

    res.json({
      redirectUrl: response.data.redirectUrl,
      orderId,
    });
  } catch (error) {
    console.error("🔥 PAYMENT ERROR:", error.response?.data || error.message);
    res.status(500).json({ message: "Payment failed" });
  }
});

router.get("/verify-payment", async (req, res) => {
  try {
    const { orderId } = req.query;

    // ✅ CHECK DB FIRST (VERY IMPORTANT)
    const payment = await Payment.findOne({ orderId });

    if (payment?.status === "COMPLETED") {
      return res.json({ success: true, status: "COMPLETED" });
    }

    // STEP 1: Get token
    const tokenRes = await axios.post(
      //   "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
      //   "https://api.phonepe.com/apis/pg/v1/oauth/token",
      "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
      qs.stringify({
        client_id: process.env.PHONE_PE_CLIENT_ID,
        client_version: "1",
        client_secret: process.env.PHONE_PE_CLIENT_SECRET_KEY,
        grant_type: "client_credentials",
      }),
      //   new URLSearchParams({
      //     client_id: process.env.PHONE_PE_CLIENT_ID,
      //     client_version: "1",
      //     client_secret: process.env.PHONE_PE_CLIENT_SECRET_KEY,
      //     grant_type: "client_credentials",
      //   }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const token = tokenRes.data.access_token;

    // STEP 2: Check status
    const response = await axios.get(
      //   `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${orderId}/status`,
      `https://api.phonepe.com/apis/pg/checkout/v2/order/${orderId}/status`,
      {
        headers: {
          Authorization: `O-Bearer ${token}`,
        },
      },
    );

    // const state = response.data?.state || response.data?.data?.state;

    // console.log("FINAL STATE:", state);

    // if (state === "COMPLETED") {
    //   return res.json({ success: true, status: "COMPLETED" });
    // }

    // if (state === "FAILED") {
    //   return res.json({ success: false, status: "FAILED" });
    // }

    // return res.json({ success: false, status: "PENDING" });
    const state = response.data?.state || response.data?.data?.state;

    console.log("PHONEPE FULL RESPONSE:", response.data);
    console.log("FINAL STATE:", state);

    // ✅ HANDLE ALL SUCCESS STATES
    if (["COMPLETED", "SUCCESS", "PAYMENT_SUCCESS"].includes(state)) {
      return res.json({ success: true, status: "COMPLETED" });
    }

    // ❌ HANDLE FAIL STATES
    if (["FAILED", "DECLINED"].includes(state)) {
      return res.json({ success: false, status: "FAILED" });
    }

    // ⏳ OTHERWISE PENDING
    return res.json({ success: false, status: "PENDING" });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.json({ success: false, status: "ERROR" });
  }
});

router.post("/payment-status", async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT");
    console.log("BODY:", JSON.stringify(req.body, null, 2));

    if (req.body?.data === "WEBHOOK_VALIDATION_SUCCESS") {
      return res.status(200).json({ message: "ok" });
    }

    const event = req.body?.event;

    const orderId =
      req.body?.payload?.merchantOrderId ||
      req.body?.payload?.orderId ||
      req.body?.merchantOrderId;

    console.log("EVENT:", event);
    console.log("ORDER ID:", orderId);

    if (!orderId) return res.sendStatus(200);

    if (event === "pg.order.completed") {
      await Payment.findOneAndUpdate({ orderId }, { status: "COMPLETED" });
    }

    if (event === "pg.order.failed") {
      await Payment.findOneAndUpdate({ orderId }, { status: "FAILED" });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = router;

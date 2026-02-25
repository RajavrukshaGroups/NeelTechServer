const express = require("express");
const router = express.Router();
const { sendContactMail } = require("../controller/userController");

router.post("/contact", sendContactMail);

module.exports = router;
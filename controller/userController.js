const nodemailer = require("nodemailer");

const sendContactMail = async (req, res) => {
  console.log("Received contact form submission:", req.body);
  try {
    const { fullName, email, phone,course,message,platform } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your gmail
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    // Mail options
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission from ${fullName}`,
      html: `
        <h2>Contact Form Details</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not Provided"}</p>
       <p><strong>Course:</strong> ${course || "Not Provided"}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Platform:</strong> ${platform || "Not Provided"}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Message sent successfully!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

module.exports = { sendContactMail };
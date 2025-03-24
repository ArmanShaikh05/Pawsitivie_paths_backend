import { resend } from "../server.js";


// Function to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Function to send OTP via email
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOTP();
    
    // Store OTP in your database (Firebase, Redis, etc.)
    // Here, we're storing it in memory for testing
    global.otpStore = { email, otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // Expires in 5 min

    const emailResponse = await resend.emails.send({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
    });

    return res.status(200).json({ message: "OTP sent successfully", emailResponse });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Error sending OTP", error });
  }
};


export const verifyOTP = (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
  
    if (!global.otpStore || global.otpStore.email !== email) {
      return res.status(400).json({ message: "OTP not found for this email" });
    }
  
    if (global.otpStore.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
  
    if (Date.now() > global.otpStore.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }
  
    // Clear the stored OTP after successful verification
    delete global.otpStore;
  
    return res.status(200).json({ message: "OTP verified successfully" });
  };
  
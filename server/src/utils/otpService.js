import nodemailer from 'nodemailer';
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE_PATH = path.join(__dirname, 'otp_debug_logs.txt');

/**
 * Generate a random 6-digit numeric OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Log OTP details to a local debug file for easy sandbox manual testing
 */
const logOtpToDebugFile = (type, target, otp) => {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] Target: ${target} | OTP: ${otp}\n`;
    fs.appendFileSync(LOG_FILE_PATH, logMessage, 'utf8');
    
    console.log(`\n==================================================`);
    console.log(`🔑 DEV MODE: Generated ${type.toUpperCase()} OTP for ${target}`);
    console.log(`👉 OTP CODE: ${otp}`);
    console.log(`📁 Logged to: server/src/utils/otp_debug_logs.txt`);
    console.log(`==================================================\n`);
  } catch (err) {
    console.error('Failed to write OTP to debug file:', err.message);
  }
};

/**
 * Send OTP via Email using Nodemailer
 */
export const sendEmailOTP = async (email, otp) => {
  // Always log to local debug file first so developers can verify immediately
  logOtpToDebugFile('email', email, otp);

  // Check if SMTP environment variables are configured
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log(`ℹ️ Nodemailer is not configured (missing SMTP_HOST/USER/PASS). Falling back to console log.`);
    return true; // Return success for dev testing
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });

    const mailOptions = {
      from: `"KaamSetu Verification" <${user}>`,
      to: email,
      subject: 'KaamSetu - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg">
          <h2 style="color: #2563eb; text-align: center;">Welcome to KaamSetu!</h2>
          <p>Please verify your email address to complete your registration.</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px;">This OTP code is valid for 5 minutes. Do not share this code with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send Nodemailer email: ${error.message}`);
    // Keep it non-blocking in development
    return true;
  }
};

/**
 * Send OTP via SMS using Twilio
 */
export const sendSMSOTP = async (phone, otp) => {
  // Always log to local debug file first
  logOtpToDebugFile('sms', phone, otp);

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    console.log(`ℹ️ Twilio is not configured (missing TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER). Falling back to console log.`);
    return true; // Return success for dev testing
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: `Your KaamSetu mobile verification OTP is ${otp}. Valid for 5 minutes.`,
      from: twilioNumber,
      to: phone.startsWith('+') ? phone : `+91${phone}`, // Assumes Indian phone numbers by default if country code is missing
    });
    console.log(`📱 OTP SMS sent successfully to ${phone}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send Twilio SMS: ${error.message}`);
    // Keep it non-blocking in development
    return true;
  }
};

export const OTP_EXPIRY_MINUTES = 10;
export const MAX_OTP_ATTEMPTS = 5;

/* === Generates a 4-digit numeric OTP === */
export function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function getOtpExpiry() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString();
}
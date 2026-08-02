export function validatePhone(phone) {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (!digits) return "Phone number is required";
  if (digits.length !== 10) return "Enter a valid 10-digit phone number";
  if (!/^[6-9]/.test(digits)) return "Enter a valid Indian mobile number";
  return null;
}

export function validatePincode(pincode) {
  const d = (pincode || "").toString().trim();
  if (!d) return "Pincode is required";
  if (!/^[1-9][0-9]{5}$/.test(d)) return "Enter a valid 6-digit pincode";
  return null;
}

export function validateAddress(address = {}) {
  const errors = {};
  if (!address.name || address.name.trim().length < 2) errors.name = "Full name is required";
  if (!address.street || address.street.trim().length < 5) errors.street = "Street address is required";
  if (!address.city || address.city.trim().length < 2) errors.city = "City is required";
  if (!address.state || address.state.trim().length < 2) errors.state = "State is required";
  const pinErr = validatePincode(address.pincode);
  if (pinErr) errors.pincode = pinErr;
  const phoneErr = validatePhone(address.phone);
  if (phoneErr) errors.phone = phoneErr;
  return errors;
}

export function normalizeEmail(email) { return (email || "").trim().toLowerCase(); }
export function validateEmail(email) {
  const e = normalizeEmail(email);
  if (!e) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Enter a valid email";
  return null;
}

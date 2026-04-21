export function formatNigerianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("234") && digits.length === 13) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "234" + digits.substring(1);
  if (digits.length === 10) return "234" + digits;
  if (digits.startsWith("234")) return digits;
  return "234" + digits;
}

export function getWhatsAppLink(phone: string, message?: string): string {
  if (!phone) return "#";
  const formatted = formatNigerianPhone(phone);
  const base = `https://wa.me/${formatted}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
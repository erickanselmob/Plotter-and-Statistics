export const ADMIN_EMAILS = [
  "erickanselmob@gmail.com",
  "maripaagliusi@gmail.com",
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase());
}



const COOKIE_NAME = "token";

const cookieOptions = (maxAgeSeconds = 60 * 60 * 24 * 30) => {
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  return `; Path=/; Expires=${expires}; SameSite=Lax; Secure`;
};

export const saveToken = (token: string) => {
  // Default: 30 days
  const opts = cookieOptions();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}${opts}`;
};

export const getToken = (): string | null => {
  const nameEQ = `${COOKIE_NAME}=`;
  const parts = document.cookie.split("; ");
  const match = parts.find((p) => p.startsWith(nameEQ));
  if (!match) return null;
  const value = match.substring(nameEQ.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value || null;
  }
};

export const removeToken = () => {
  // Expire the cookie
  document.cookie = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
};

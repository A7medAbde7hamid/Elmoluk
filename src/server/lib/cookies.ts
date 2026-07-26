function isLocalhost(headers: Headers): boolean {
  if (process.env.VERCEL) return false;
  const forwardedProto = headers.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto === "http";
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function getSessionCookieOptions(headers: Headers) {
  const localhost = isLocalhost(headers);

  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: !localhost,
  };
}

export function encodeRawEmail(opts: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}): string {
  const lines = [
    ...(opts.from ? [`From: ${opts.from}`] : []),
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    opts.body,
  ];
  const message = lines.join("\r\n");
  const base64 = Buffer.from(message, "utf-8").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

export function extractBodyFromPayload(payload?: GmailPart): string {
  if (!payload) return "";

  // For multipart, scan all immediate children and prefer text/html over text/plain.
  // HTML versions render tracking links as styled hyperlinks rather than raw URL text.
  if (payload.parts && payload.parts.length > 0) {
    let html = "";
    let plain = "";
    for (const part of payload.parts) {
      if (!html && part.mimeType === "text/html" && part.body?.data) {
        html = decodeBase64Url(part.body.data);
      } else if (!plain && part.mimeType === "text/plain" && part.body?.data) {
        plain = decodeBase64Url(part.body.data);
      } else if (!html && !plain) {
        const nested = extractBodyFromPayload(part);
        if (nested) plain = nested;
      }
    }
    if (html) return html;
    if (plain) return plain;
  }

  // Single-part: prefer html, then plain, then any raw data
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return "";
}

export function getHeader(
  headers: { name?: string; value?: string }[] | undefined,
  name: string,
): string {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

type SendWhatsappTextParams = {
  number: string;
  message: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return value.trim();
}

export function normalizeWhatsappNumber(input: string) {
  return (input || "").replace(/\D/g, "");
}

export function formatWhatsappJid(number: string) {
  return `${normalizeWhatsappNumber(number)}@s.whatsapp.net`;
}

export function generateVerificationCode(length = 4) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    if (i % 2 === 0) {
      code += letters[Math.floor(Math.random() * letters.length)];
    } else {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
  }
  return code;
}

export async function sendWhatsappText(params: SendWhatsappTextParams) {
  const instance = getRequiredEnv("WEVO_INSTANCE");
  const apiKey = getRequiredEnv("WEVO_API_KEY");
  const number = normalizeWhatsappNumber(params.number);

  if (!number) {
    throw new Error("Numero de WhatsApp invalido.");
  }

  const response = await fetch(`https://wevoapi.omniagencia.com/message/sendText/${instance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: formatWhatsappJid(number),
      text: params.message || "Mensaje aqui",
      linkPreview: false,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    response?: { message?: string };
    error?: string;
  };

  if (!response.ok) {
    const details =
      payload?.response?.message ||
      payload?.message ||
      payload?.error ||
      `HTTP ${response.status}`;
    throw new Error(`No se pudo enviar WhatsApp: ${details}`);
  }

  return payload;
}

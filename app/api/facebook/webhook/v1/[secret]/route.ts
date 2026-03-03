import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { jsonUtf8 } from "../../../../../lib/api-utf8";
import { processIncomingCommentForPage } from "../../../../../lib/facebook-comment-automation";

type WebhookChange = {
  field?: string;
  value?: {
    item?: string;
    verb?: string;
    comment_id?: string;
    post_id?: string;
    parent_id?: string;
  };
};

type WebhookEntry = {
  id?: string;
  changes?: WebhookChange[];
};

type WebhookBody = {
  object?: string;
  entry?: WebhookEntry[];
};

function isValidSignature(rawBody: string, signatureHeader: string | null, appSecret: string) {
  if (!signatureHeader) return false;
  const [algo, providedDigest] = signatureHeader.split("=");
  if (!algo || !providedDigest || algo !== "sha256") return false;

  const expectedDigest = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = Buffer.from(providedDigest, "hex");
  const expected = Buffer.from(expectedDigest, "hex");
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

function getPathSecret(params: { secret: string } | Promise<{ secret: string }>) {
  if (params instanceof Promise) return params.then((value) => value.secret || "");
  return Promise.resolve(params.secret || "");
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ secret: string }> | { secret: string } }
) {
  const pathSecret = await getPathSecret(context.params);
  const webhookPathToken = process.env.FACEBOOK_WEBHOOK_PATH_TOKEN || "";
  if (!webhookPathToken || pathSecret !== webhookPathToken) {
    return jsonUtf8({ error: "Not found" }, { status: 404 });
  }

  const url = request.nextUrl;
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "";

  if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return jsonUtf8({ error: "Invalid webhook verification" }, { status: 403 });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ secret: string }> | { secret: string } }
) {
  const pathSecret = await getPathSecret(context.params);
  const webhookPathToken = process.env.FACEBOOK_WEBHOOK_PATH_TOKEN || "";
  if (!webhookPathToken || pathSecret !== webhookPathToken) {
    return jsonUtf8({ error: "Not found" }, { status: 404 });
  }

  try {
    const rawBody = await request.text();
    const appSecret = process.env.FACEBOOK_APP_SECRET || "";
    if (!appSecret) {
      return jsonUtf8({ error: "FACEBOOK_APP_SECRET missing" }, { status: 500 });
    }

    const signatureHeader = request.headers.get("x-hub-signature-256");
    if (!isValidSignature(rawBody, signatureHeader, appSecret)) {
      return jsonUtf8({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as WebhookBody;
    if (payload.object !== "page") {
      return jsonUtf8({ ok: true, ignored: true });
    }

    const results: Array<Record<string, unknown>> = [];
    for (const entry of payload.entry || []) {
      const pageId = entry.id || "";
      if (!pageId) continue;

      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;
        if (change.field !== "feed") continue;
        if (value.item !== "comment") continue;
        if (value.verb !== "add") continue;
        if (!value.comment_id) continue;
        if (value.parent_id) continue;

        const processed = await processIncomingCommentForPage(pageId, value.comment_id, value.post_id || null);
        results.push(processed);
      }
    }

    return jsonUtf8({ ok: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return jsonUtf8({ error: message }, { status: 500 });
  }
}

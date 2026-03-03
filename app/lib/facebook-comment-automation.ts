import { supabaseAdmin } from "./supabase-admin";
import { initFacebookApi, readFacebookError } from "./facebook-sdk";

type RuleRow = {
  id: string;
  user_id: string;
  facebook_page_id: string;
  keyword: string;
  keyword_normalized: string;
  reply_message: string;
  send_dm: boolean;
  dm_message: string | null;
  is_active: boolean;
  created_at: string;
};

type PageRow = {
  user_id: string;
  facebook_page_id: string;
  page_access_token: string | null;
};

type PageTokenRow = {
  user_id: string;
  facebook_page_id: string;
  page_access_token: string | null;
};

type CommentRow = {
  id?: string;
  message?: string;
  created_time?: string;
  from?: { id?: string; name?: string };
  parent?: { id?: string };
};

type AutomationSummary = {
  processedComments: number;
  matchedComments: number;
  publicRepliesSent: number;
  dmSent: number;
  dmFailed: number;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function keywordMatched(message: string, keywordNormalized: string) {
  if (!keywordNormalized) return false;
  const normalizedMessage = normalizeText(message);
  return normalizedMessage.includes(keywordNormalized);
}

async function fetchAllPages<T>(
  pageToken: string,
  path: string[],
  params: Record<string, string>,
  maxPages = 10
): Promise<T[]> {
  const api = initFacebookApi(pageToken);
  const rows: T[] = [];
  let query = { ...params };

  for (let page = 0; page < maxPages; page += 1) {
    let payload: { data?: T[]; paging?: { next?: string; cursors?: { after?: string } }; error?: { message?: string } };
    try {
      payload = (await api.call("GET", path, query)) as {
        data?: T[];
        paging?: { next?: string; cursors?: { after?: string } };
        error?: { message?: string };
      };
    } catch (err) {
      throw new Error(readFacebookError(err, "No se pudo leer datos de Facebook"));
    }

    if (payload.error?.message) throw new Error(payload.error.message);
    if (payload.data?.length) rows.push(...payload.data);

    if (!payload.paging?.next) break;
    const after = payload.paging?.cursors?.after;
    if (!after) break;
    query = { ...query, after };
  }

  return rows;
}

async function getActiveRulesForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("comment_automation_rules")
    .select("id,user_id,facebook_page_id,keyword,keyword_normalized,reply_message,send_dm,dm_message,is_active,created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as RuleRow[];
}

async function getRulesForAllUsers() {
  const { data, error } = await supabaseAdmin
    .from("comment_automation_rules")
    .select("id,user_id,facebook_page_id,keyword,keyword_normalized,reply_message,send_dm,dm_message,is_active,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as RuleRow[];
}

async function getPageToken(userId: string, facebookPageId: string) {
  const { data, error } = await supabaseAdmin
    .from("facebook_pages")
    .select("user_id,facebook_page_id,page_access_token")
    .eq("user_id", userId)
    .eq("facebook_page_id", facebookPageId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data || null) as PageRow | null;
}

async function getPageTokensByFacebookPageId(facebookPageId: string) {
  const { data, error } = await supabaseAdmin
    .from("facebook_pages")
    .select("user_id,facebook_page_id,page_access_token")
    .eq("facebook_page_id", facebookPageId);
  if (error) throw new Error(error.message);
  return (data || []) as PageTokenRow[];
}

async function getCursor(userId: string, facebookPageId: string) {
  const { data, error } = await supabaseAdmin
    .from("comment_automation_cursors")
    .select("last_checked_at")
    .eq("user_id", userId)
    .eq("facebook_page_id", facebookPageId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.last_checked_at as string | undefined) || null;
}

async function setCursor(userId: string, facebookPageId: string, lastCheckedAt: string) {
  const { error } = await supabaseAdmin
    .from("comment_automation_cursors")
    .upsert(
      {
        user_id: userId,
        facebook_page_id: facebookPageId,
        last_checked_at: lastCheckedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,facebook_page_id" }
    );
  if (error) throw new Error(error.message);
}

async function alreadyProcessed(userId: string, ruleId: string, commentId: string) {
  const { data, error } = await supabaseAdmin
    .from("comment_automation_events")
    .select("id")
    .eq("user_id", userId)
    .eq("rule_id", ruleId)
    .eq("facebook_comment_id", commentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

async function insertEvent(row: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from("comment_automation_events")
    .upsert(row, { onConflict: "user_id,rule_id,facebook_comment_id" });
  if (error) throw new Error(error.message);
}

async function processPageRules(userId: string, pageId: string, rules: RuleRow[]) {
  const summary: AutomationSummary = {
    processedComments: 0,
    matchedComments: 0,
    publicRepliesSent: 0,
    dmSent: 0,
    dmFailed: 0,
  };

  const page = await getPageToken(userId, pageId);
  if (!page?.page_access_token) {
    throw new Error(`No page access token for page ${pageId}. Reconecta Facebook para refrescar tokens.`);
  }

  const pageToken = page.page_access_token;
  const lastCheckedAt = await getCursor(userId, pageId);
  const sinceUnix = lastCheckedAt
    ? Math.floor(new Date(lastCheckedAt).getTime() / 1000)
    : Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

  const posts = await fetchAllPages<{ id?: string }>(
    pageToken,
    [pageId, "feed"],
    { fields: "id,created_time", limit: "15" },
    3
  );

  const api = initFacebookApi(pageToken);
  const sortedRules = [...rules].sort((a, b) => b.keyword_normalized.length - a.keyword_normalized.length);

  for (const post of posts) {
    const postId = post.id;
    if (!postId) continue;

    const comments = await fetchAllPages<CommentRow>(
      pageToken,
      [postId, "comments"],
      {
        fields: "id,message,created_time,from{id,name},parent{id}",
        filter: "stream",
        limit: "100",
        since: String(sinceUnix),
      },
      5
    ).catch(() => []);

    for (const comment of comments) {
      const commentId = comment.id || "";
      const message = comment.message || "";
      if (!commentId || !message.trim()) continue;

      // Ignore replies and self comments.
      if (comment.parent?.id) continue;
      if (comment.from?.id && comment.from.id === pageId) continue;

      summary.processedComments += 1;

      const matchedRule = sortedRules.find((rule) => keywordMatched(message, rule.keyword_normalized));
      if (!matchedRule) continue;

      const skip = await alreadyProcessed(userId, matchedRule.id, commentId);
      if (skip) continue;

      summary.matchedComments += 1;

      let publicReplySent = false;
      let publicReplyCommentId: string | null = null;
      let dmSent = false;
      let dmError: string | null = null;

      try {
        const replyPayload = (await api.call("POST", [commentId, "comments"], {
          message: matchedRule.reply_message,
        })) as { id?: string; error?: { message?: string } };
        if (replyPayload.error?.message) throw new Error(replyPayload.error.message);
        publicReplySent = true;
        publicReplyCommentId = replyPayload.id || null;
        summary.publicRepliesSent += 1;
      } catch (err) {
        dmError = readFacebookError(err, "No se pudo enviar respuesta publica");
      }

      if (matchedRule.send_dm && matchedRule.dm_message?.trim()) {
        try {
          const dmPayload = (await api.call("POST", [commentId, "private_replies"], {
            message: matchedRule.dm_message,
          })) as { error?: { message?: string } };
          if (dmPayload.error?.message) throw new Error(dmPayload.error.message);
          dmSent = true;
          summary.dmSent += 1;
        } catch (err) {
          dmError = readFacebookError(err, "No se pudo enviar DM");
          summary.dmFailed += 1;
        }
      }

      await insertEvent({
        user_id: userId,
        rule_id: matchedRule.id,
        facebook_page_id: pageId,
        facebook_post_id: postId,
        facebook_comment_id: commentId,
        comment_message: message,
        matched_keyword: matchedRule.keyword,
        public_reply_sent: publicReplySent,
        public_reply_comment_id: publicReplyCommentId,
        dm_sent: dmSent,
        dm_error: dmError,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  await setCursor(userId, pageId, new Date().toISOString());
  return summary;
}

async function processSingleCommentForUser(
  userId: string,
  pageId: string,
  commentId: string,
  postId?: string | null
) {
  const summary: AutomationSummary = {
    processedComments: 0,
    matchedComments: 0,
    publicRepliesSent: 0,
    dmSent: 0,
    dmFailed: 0,
  };

  const page = await getPageToken(userId, pageId);
  if (!page?.page_access_token) {
    throw new Error(`No page access token for page ${pageId}. Reconecta Facebook para refrescar tokens.`);
  }

  const rules = await getActiveRulesForUser(userId);
  const pageRules = rules.filter((rule) => rule.facebook_page_id === pageId);
  if (pageRules.length === 0) return summary;

  const api = initFacebookApi(page.page_access_token);
  const sortedRules = [...pageRules].sort((a, b) => b.keyword_normalized.length - a.keyword_normalized.length);

  let comment: CommentRow;
  try {
    comment = (await api.call("GET", [commentId], {
      fields: "id,message,created_time,from{id,name},parent{id}",
    })) as CommentRow;
  } catch (err) {
    throw new Error(readFacebookError(err, "No se pudo leer comentario de Facebook"));
  }

  const message = comment.message || "";
  if (!comment.id || !message.trim()) return summary;
  if (comment.parent?.id) return summary;
  if (comment.from?.id && comment.from.id === pageId) return summary;

  summary.processedComments += 1;

  const matchedRule = sortedRules.find((rule) => keywordMatched(message, rule.keyword_normalized));
  if (!matchedRule) return summary;

  const skip = await alreadyProcessed(userId, matchedRule.id, comment.id);
  if (skip) return summary;

  summary.matchedComments += 1;

  let publicReplySent = false;
  let publicReplyCommentId: string | null = null;
  let dmSent = false;
  let dmError: string | null = null;

  try {
    const replyPayload = (await api.call("POST", [comment.id, "comments"], {
      message: matchedRule.reply_message,
    })) as { id?: string; error?: { message?: string } };
    if (replyPayload.error?.message) throw new Error(replyPayload.error.message);
    publicReplySent = true;
    publicReplyCommentId = replyPayload.id || null;
    summary.publicRepliesSent += 1;
  } catch (err) {
    dmError = readFacebookError(err, "No se pudo enviar respuesta publica");
  }

  if (matchedRule.send_dm && matchedRule.dm_message?.trim()) {
    try {
      const dmPayload = (await api.call("POST", [comment.id, "private_replies"], {
        message: matchedRule.dm_message,
      })) as { error?: { message?: string } };
      if (dmPayload.error?.message) throw new Error(dmPayload.error.message);
      dmSent = true;
      summary.dmSent += 1;
    } catch (err) {
      dmError = readFacebookError(err, "No se pudo enviar DM");
      summary.dmFailed += 1;
    }
  }

  await insertEvent({
    user_id: userId,
    rule_id: matchedRule.id,
    facebook_page_id: pageId,
    facebook_post_id: postId || null,
    facebook_comment_id: comment.id,
    comment_message: message,
    matched_keyword: matchedRule.keyword,
    public_reply_sent: publicReplySent,
    public_reply_comment_id: publicReplyCommentId,
    dm_sent: dmSent,
    dm_error: dmError,
    processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await setCursor(userId, pageId, new Date().toISOString());
  return summary;
}

export async function runCommentAutomationForUser(userId: string) {
  const rules = await getActiveRulesForUser(userId);
  const rulesByPage = new Map<string, RuleRow[]>();
  rules.forEach((rule) => {
    const list = rulesByPage.get(rule.facebook_page_id) || [];
    list.push(rule);
    rulesByPage.set(rule.facebook_page_id, list);
  });

  const pageSummaries: Array<{ pageId: string; summary: AutomationSummary }> = [];
  const failures: Array<{ pageId: string; error: string }> = [];

  for (const [pageId, pageRules] of rulesByPage) {
    try {
      const summary = await processPageRules(userId, pageId, pageRules);
      pageSummaries.push({ pageId, summary });
    } catch (err) {
      failures.push({
        pageId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const total = pageSummaries.reduce(
    (acc, row) => {
      acc.processedComments += row.summary.processedComments;
      acc.matchedComments += row.summary.matchedComments;
      acc.publicRepliesSent += row.summary.publicRepliesSent;
      acc.dmSent += row.summary.dmSent;
      acc.dmFailed += row.summary.dmFailed;
      return acc;
    },
    { processedComments: 0, matchedComments: 0, publicRepliesSent: 0, dmSent: 0, dmFailed: 0 }
  );

  return {
    userId,
    pagesProcessed: pageSummaries.length,
    failures,
    ...total,
  };
}

export async function runCommentAutomationForAllUsers() {
  const rules = await getRulesForAllUsers();
  const users = Array.from(new Set(rules.map((rule) => rule.user_id)));
  const results: Array<Record<string, unknown>> = [];
  const failures: Array<{ userId: string; error: string }> = [];

  for (const userId of users) {
    try {
      const summary = await runCommentAutomationForUser(userId);
      results.push(summary);
    } catch (err) {
      failures.push({
        userId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return {
    processedUsers: results.length,
    failedUsers: failures.length,
    results,
    failures,
  };
}

export async function processIncomingCommentForPage(
  facebookPageId: string,
  commentId: string,
  postId?: string | null
) {
  const pageTokens = await getPageTokensByFacebookPageId(facebookPageId);
  const results: Array<Record<string, unknown>> = [];
  const failures: Array<{ userId: string; error: string }> = [];

  for (const pageRow of pageTokens) {
    try {
      const summary = await processSingleCommentForUser(
        pageRow.user_id,
        facebookPageId,
        commentId,
        postId || null
      );
      results.push({ userId: pageRow.user_id, ...summary });
    } catch (err) {
      failures.push({
        userId: pageRow.user_id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return {
    pageId: facebookPageId,
    commentId,
    processedUsers: results.length,
    failedUsers: failures.length,
    results,
    failures,
  };
}

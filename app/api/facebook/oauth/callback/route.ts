import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type GraphPagingResponse<T> = {
  data?: T[];
  paging?: { next?: string };
  error?: { message?: string };
};

const GRAPH_BASE_URL = "https://graph.facebook.com/v23.0";

function getBaseUrl(origin: string) {
  return process.env.NEXT_PUBLIC_SITE_URL || origin;
}

function redirectWithError(base: string, message: string) {
  return NextResponse.redirect(
    `${base}/setup/connect-assets?status=error&message=${encodeURIComponent(message)}`
  );
}

function redirectWithSuccess(base: string) {
  return NextResponse.redirect(`${base}/dashboard`);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: { message?: string } }).error?.message === "string"
        ? (payload as { error?: { message?: string } }).error!.message!
        : "Request failed";
    throw new Error(message);
  }
  return payload as T;
}

async function graphFetchPaginated<T>(
  url: string,
  maxPages = 20
): Promise<T[]> {
  const rows: T[] = [];
  let nextUrl: string | undefined = url;
  let pages = 0;

  while (nextUrl && pages < maxPages) {
    const pageResponse: GraphPagingResponse<T> =
      await fetchJson<GraphPagingResponse<T>>(nextUrl);
    if (pageResponse.error?.message) throw new Error(pageResponse.error.message);
    if (pageResponse.data?.length) rows.push(...pageResponse.data);
    nextUrl = pageResponse.paging?.next;
    pages += 1;
  }

  return rows;
}

export async function GET(request: NextRequest) {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const baseUrl = getBaseUrl(request.nextUrl.origin);
    const redirectUri = `${baseUrl}/api/facebook/oauth/callback`;

    if (!appId || !appSecret) {
      return redirectWithError(baseUrl, "Faltan FACEBOOK_APP_ID o FACEBOOK_APP_SECRET");
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const stateCookie = request.cookies.get("fb_oauth_state")?.value;

    if (!code) return redirectWithError(baseUrl, "No se recibio codigo OAuth");
    if (!state || !stateCookie || state !== stateCookie) {
      return redirectWithError(baseUrl, "Estado OAuth invalido");
    }

    const supabaseServer = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) return redirectWithError(baseUrl, "Sesion invalida");

    const shortTokenUrl =
      `${GRAPH_BASE_URL}/oauth/access_token` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${encodeURIComponent(code)}`;

    const shortToken = await fetchJson<{
      access_token: string;
      token_type?: string;
      expires_in?: number;
    }>(shortTokenUrl);

    const longTokenUrl =
      `${GRAPH_BASE_URL}/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(shortToken.access_token)}`;

    const longToken = await fetchJson<{
      access_token: string;
      token_type?: string;
      expires_in?: number;
    }>(longTokenUrl);

    const appAccessToken = `${appId}|${appSecret}`;
    const debugTokenUrl =
      `${GRAPH_BASE_URL}/debug_token` +
      `?input_token=${encodeURIComponent(longToken.access_token)}` +
      `&access_token=${encodeURIComponent(appAccessToken)}`;

    const debugToken = await fetchJson<{
      data?: {
        expires_at?: number;
        scopes?: string[];
      };
    }>(debugTokenUrl);

    const meUrl =
      `${GRAPH_BASE_URL}/me` +
      `?fields=id,name,email,picture.width(200).height(200){url}` +
      `&access_token=${encodeURIComponent(longToken.access_token)}`;

    const me = await fetchJson<{
      id: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    }>(meUrl);

    const expiresAt =
      debugToken.data?.expires_at && debugToken.data.expires_at > 0
        ? new Date(debugToken.data.expires_at * 1000).toISOString()
        : longToken.expires_in
        ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
        : null;

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from("facebook_connections")
      .upsert(
        {
          user_id: user.id,
          facebook_user_id: me.id,
          access_token: longToken.access_token,
          token_expires_at: expiresAt,
          scopes: debugToken.data?.scopes || [],
          facebook_name: me.name || null,
          facebook_email: me.email || null,
          facebook_profile_picture_url: me.picture?.data?.url || null,
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (connectionError || !connection?.id) {
      throw new Error(connectionError?.message || "No se pudo guardar la conexion");
    }

    const token = longToken.access_token;
    const connectionId = connection.id;

    const businesses = await graphFetchPaginated<{ id: string; name?: string }>(
      `${GRAPH_BASE_URL}/me/businesses?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
    );

    const adAccounts = await graphFetchPaginated<{
      id: string;
      account_id?: string;
      name?: string;
      currency?: string;
      timezone_name?: string;
      business?: { id?: string; name?: string };
    }>(
      `${GRAPH_BASE_URL}/me/adaccounts?fields=id,account_id,name,currency,timezone_name,business{id,name}&limit=200&access_token=${encodeURIComponent(token)}`
    );

    const pages = await graphFetchPaginated<{
      id: string;
      name?: string;
      category?: string;
      access_token?: string;
      tasks?: string[];
    }>(
      `${GRAPH_BASE_URL}/me/accounts?fields=id,name,category,access_token,tasks&limit=200&access_token=${encodeURIComponent(token)}`
    );

    if (businesses.length > 0) {
      await supabaseAdmin.from("facebook_business_managers").upsert(
        businesses.map((bm) => ({
          connection_id: connectionId,
          user_id: user.id,
          facebook_business_id: bm.id,
          name: bm.name || null,
        })),
        { onConflict: "user_id,facebook_business_id" }
      );
    }

    if (adAccounts.length > 0) {
      await supabaseAdmin.from("facebook_ad_accounts").upsert(
        adAccounts.map((ad) => ({
          connection_id: connectionId,
          user_id: user.id,
          facebook_ad_account_id: ad.id,
          account_id: ad.account_id || null,
          name: ad.name || null,
          currency: ad.currency || null,
          timezone_name: ad.timezone_name || null,
          business_id: ad.business?.id || null,
          business_name: ad.business?.name || null,
        })),
        { onConflict: "user_id,facebook_ad_account_id" }
      );
    }

    if (pages.length > 0) {
      await supabaseAdmin.from("facebook_pages").upsert(
        pages.map((page) => ({
          connection_id: connectionId,
          user_id: user.id,
          facebook_page_id: page.id,
          name: page.name || null,
          category: page.category || null,
          page_access_token: page.access_token || null,
          tasks: page.tasks || [],
        })),
        { onConflict: "user_id,facebook_page_id" }
      );
    }

    const instagramRows: Array<{
      connection_id: string;
      user_id: string;
      facebook_page_id: string;
      instagram_account_id: string;
      username: string | null;
      name: string | null;
    }> = [];

    for (const page of pages) {
      const igData = await fetchJson<{
        instagram_business_account?: { id: string; username?: string; name?: string };
      }>(
        `${GRAPH_BASE_URL}/${page.id}?fields=instagram_business_account{id,username,name}&access_token=${encodeURIComponent(token)}`
      ).catch(
        (): {
          instagram_business_account?: { id: string; username?: string; name?: string };
        } => ({})
      );

      if (igData.instagram_business_account?.id) {
        instagramRows.push({
          connection_id: connectionId,
          user_id: user.id,
          facebook_page_id: page.id,
          instagram_account_id: igData.instagram_business_account.id,
          username: igData.instagram_business_account.username || null,
          name: igData.instagram_business_account.name || null,
        });
      }
    }

    if (instagramRows.length > 0) {
      await supabaseAdmin.from("facebook_instagram_accounts").upsert(instagramRows, {
        onConflict: "user_id,instagram_account_id",
      });
    }

    const pixelRows: Array<{
      connection_id: string;
      user_id: string;
      facebook_ad_account_id: string;
      facebook_pixel_id: string;
      name: string | null;
    }> = [];

    const adsetRows: Array<{
      connection_id: string;
      user_id: string;
      facebook_ad_account_id: string;
      facebook_adset_id: string;
      campaign_id: string | null;
      campaign_name: string | null;
      name: string | null;
      status: string | null;
    }> = [];

    for (const ad of adAccounts) {
      const accountEdgeId = ad.id.startsWith("act_") ? ad.id : `act_${ad.account_id || ad.id}`;

      const pixels = await graphFetchPaginated<{ id: string; name?: string }>(
        `${GRAPH_BASE_URL}/${accountEdgeId}/adspixels?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
      ).catch(() => []);

      const datasets = await graphFetchPaginated<{ id: string; name?: string }>(
        `${GRAPH_BASE_URL}/${accountEdgeId}/datasets?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
      ).catch(() => []);

      const uniqueTrackingAssets = new Map<string, { id: string; name?: string }>();
      [...pixels, ...datasets].forEach((asset) => {
        if (asset.id) uniqueTrackingAssets.set(asset.id, asset);
      });

      uniqueTrackingAssets.forEach((pixel) => {
        pixelRows.push({
          connection_id: connectionId,
          user_id: user.id,
          facebook_ad_account_id: ad.id,
          facebook_pixel_id: pixel.id,
          name: pixel.name || null,
        });
      });

      const adsets = await graphFetchPaginated<{
        id: string;
        name?: string;
        status?: string;
        campaign?: { id?: string; name?: string };
      }>(
        `${GRAPH_BASE_URL}/${accountEdgeId}/adsets?fields=id,name,status,campaign{id,name}&limit=200&access_token=${encodeURIComponent(token)}`,
        10
      ).catch(() => []);

      adsets.forEach((adset) => {
        adsetRows.push({
          connection_id: connectionId,
          user_id: user.id,
          facebook_ad_account_id: ad.id,
          facebook_adset_id: adset.id,
          campaign_id: adset.campaign?.id || null,
          campaign_name: adset.campaign?.name || null,
          name: adset.name || null,
          status: adset.status || null,
        });
      });
    }

    for (const bm of businesses) {
      const bmPixelsOwned = await graphFetchPaginated<{ id: string; name?: string }>(
        `${GRAPH_BASE_URL}/${bm.id}/owned_pixels?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
      ).catch(() => []);

      const bmPixelsClient = await graphFetchPaginated<{ id: string; name?: string }>(
        `${GRAPH_BASE_URL}/${bm.id}/client_pixels?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
      ).catch(() => []);

      const bmDatasetsOwned = await graphFetchPaginated<{ id: string; name?: string }>(
        `${GRAPH_BASE_URL}/${bm.id}/owned_datasets?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
      ).catch(() => []);

      const bmDatasetsClient = await graphFetchPaginated<{ id: string; name?: string }>(
        `${GRAPH_BASE_URL}/${bm.id}/client_datasets?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
      ).catch(() => []);

      const bmDatasetsDirect = await graphFetchPaginated<{ id: string; name?: string }>(
        `${GRAPH_BASE_URL}/${bm.id}/datasets?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
      ).catch(() => []);

      const uniqueBusinessTrackingAssets = new Map<string, { id: string; name?: string }>();
      [
        ...bmPixelsOwned,
        ...bmPixelsClient,
        ...bmDatasetsOwned,
        ...bmDatasetsClient,
        ...bmDatasetsDirect,
      ].forEach((asset) => {
        if (asset.id) uniqueBusinessTrackingAssets.set(asset.id, asset);
      });

      uniqueBusinessTrackingAssets.forEach((asset) => {
        pixelRows.push({
          connection_id: connectionId,
          user_id: user.id,
          facebook_ad_account_id: bm.id,
          facebook_pixel_id: asset.id,
          name: asset.name || null,
        });
      });
    }

    const dedupedPixelRows = Array.from(
      pixelRows.reduce((acc, row) => {
        if (!acc.has(row.facebook_pixel_id)) {
          acc.set(row.facebook_pixel_id, row);
        }
        return acc;
      }, new Map<string, (typeof pixelRows)[number]>()).values()
    );

    if (dedupedPixelRows.length > 0) {
      await supabaseAdmin.from("facebook_pixels").upsert(dedupedPixelRows, {
        onConflict: "user_id,facebook_pixel_id",
      });
    }

    if (adsetRows.length > 0) {
      await supabaseAdmin.from("facebook_adsets").upsert(adsetRows, {
        onConflict: "user_id,facebook_adset_id",
      });
    }

    // Marca onboarding como completo en la etapa de assets.
    const { data: onboardingRows, error: onboardingUpdateError } = await supabaseAdmin
      .from("user_onboarding")
      .update({ assets_connected: true })
      .eq("user_id", user.id)
      .select("user_id");

    if (onboardingUpdateError) {
      throw new Error(onboardingUpdateError.message);
    }

    if (!onboardingRows || onboardingRows.length === 0) {
      const { error: onboardingInsertError } = await supabaseAdmin
        .from("user_onboarding")
        .insert({
          user_id: user.id,
          assets_connected: true,
        });

      if (onboardingInsertError) {
        throw new Error(onboardingInsertError.message);
      }
    }

    const response = redirectWithSuccess(baseUrl);
    response.cookies.set("fb_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido en conexion Facebook";
    return redirectWithError(getBaseUrl(request.nextUrl.origin), message);
  }
}

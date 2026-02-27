"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useLocale } from "../../providers/LocaleProvider";

type StrategyRow = {
  id: string;
  name: string;
  objective: "LEADS_WEBSITE" | "LEADS_FORM" | "MESSAGES_WHATSAPP";
  status: "COMPLETED";
  created_at: string;
  completed_at: string | null;
  source_campaign_name: string | null;
  source_page_id?: string | null;
  source_whatsapp_number?: string | null;
  import_metadata?: unknown;
};

type AdAccountRow = {
  facebook_ad_account_id: string;
  account_id: string | null;
  name: string | null;
};

type PageRow = {
  facebook_page_id: string;
  name: string | null;
};

type TemplateVariable = {
  key: string;
  fieldKey?: string;
  labelEs?: string;
  labelEn?: string;
  sampleValue?: string;
  scope?: string;
};

type LaunchFieldRow = {
  id: string;
  label: string;
  value: string;
  editable: boolean;
  variableKeys: string[];
};

type LaunchFieldSection = {
  id: string;
  titleEs: string;
  titleEn: string;
  rows: LaunchFieldRow[];
};

const LAUNCH_STEPS = ["campaign", "adset", "ad", "creative", "variables"] as const;
type LaunchStepId = (typeof LAUNCH_STEPS)[number];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value.trim() || "-";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function summarizeValues(values: unknown[]): string {
  const normalized = values
    .map((value) => stringifyValue(value))
    .filter((value) => value !== "-" && value.trim().length > 0);
  if (normalized.length === 0) return "-";
  const unique = Array.from(new Set(normalized));
  if (unique.length === 1) return unique[0];
  if (unique.length <= 3) return unique.join(" | ");
  return `${unique.slice(0, 2).join(" | ")} | +${unique.length - 2} more`;
}

function hasTemplateToken(value: unknown): boolean {
  return typeof value === "string" && /{{\s*[a-zA-Z0-9_]+\s*}}/.test(value);
}

function createObjectiveUiLabels(objectiveRaw: string): { es: string; en: string } {
  const objective = (objectiveRaw || "").toUpperCase();
  if (objective === "OUTCOME_ENGAGEMENT") return { es: "Interaccion", en: "Engagement" };
  if (objective === "OUTCOME_LEADS") return { es: "Clientes potenciales", en: "Leads" };
  if (objective === "OUTCOME_SALES") return { es: "Ventas", en: "Sales" };
  if (objective === "OUTCOME_TRAFFIC") return { es: "Trafico", en: "Traffic" };
  return { es: objectiveRaw || "-", en: objectiveRaw || "-" };
}

function formatDayMonth(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function toDateTimeLocalValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return formatDateToLocalInput(parsed);
}

function formatDateToLocalInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function shiftDateTimeLocal(value: string, minutesDelta: number): string {
  const base = toDateTimeLocalValue(value);
  const date = base ? new Date(base) : new Date();
  date.setMinutes(date.getMinutes() + minutesDelta);
  return formatDateToLocalInput(date);
}

function extractTemplateKeysFromPayload(payload: unknown): string[] {
  const keys = new Set<string>();
  const walk = (value: unknown) => {
    if (typeof value === "string") {
      const matches = value.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g);
      if (matches) {
        matches.forEach((token) => {
          const key = token.replace(/{{\s*|\s*}}/g, "").trim();
          if (key) keys.add(key);
        });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((row) => walk(row));
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach((row) => walk(row));
    }
  };
  walk(payload);
  return Array.from(keys);
}

function buildLaunchVariables(strategy: StrategyRow): TemplateVariable[] {
  const importMetadata =
    strategy.import_metadata && typeof strategy.import_metadata === "object"
      ? (strategy.import_metadata as Record<string, unknown>)
      : {};
  const templateBuilder =
    importMetadata.template_builder && typeof importMetadata.template_builder === "object"
      ? (importMetadata.template_builder as Record<string, unknown>)
      : {};

  const listFromMetadata = Array.isArray(templateBuilder.variables)
    ? (templateBuilder.variables as TemplateVariable[]).filter(
        (row) => typeof row?.key === "string" && row.key.length > 0
      )
    : [];

  const templatedPayload = templateBuilder.templated_payload;
  const keysFromPayload = extractTemplateKeysFromPayload(templatedPayload);

  const byKey = new Map<string, TemplateVariable>();
  listFromMetadata.forEach((row) => byKey.set(row.key, row));
  keysFromPayload.forEach((key) => {
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        labelEs: key,
        labelEn: key,
        sampleValue: "",
        scope: "templated_payload",
      });
    }
  });

  return Array.from(byKey.values());
}

function extractPageWhatsappMap(strategy: StrategyRow): Record<string, string[]> {
  const importMetadata =
    strategy.import_metadata && typeof strategy.import_metadata === "object"
      ? (strategy.import_metadata as Record<string, unknown>)
      : {};
  const templateBuilder =
    importMetadata.template_builder && typeof importMetadata.template_builder === "object"
      ? (importMetadata.template_builder as Record<string, unknown>)
      : {};
  const original = asRecord(templateBuilder.original_payload);
  const campaign = asRecord(original.campaign);
  const adSets = Array.isArray(original.adSets) ? (original.adSets as Array<Record<string, unknown>>) : [];

  const map = new Map<string, Set<string>>();
  const ensure = (pageId: string) => {
    if (!map.has(pageId)) map.set(pageId, new Set<string>());
    return map.get(pageId)!;
  };

  const campaignPageId = stringifyValue(asRecord(campaign.promoted_object).page_id);
  const campaignPages = new Set<string>();
  if (campaignPageId !== "-") campaignPages.add(campaignPageId);

  adSets.forEach((adSet) => {
    const promoted = asRecord(adSet.promoted_object);
    const pageCandidates = new Set<string>(campaignPages);
    const adSetPage = stringifyValue(promoted.page_id);
    if (adSetPage !== "-") pageCandidates.add(adSetPage);

    const waCandidates = new Set<string>();
    const promotedWa = stringifyValue(promoted.whatsapp_phone_number || promoted.whatsapp_number);
    if (promotedWa !== "-") waCandidates.add(promotedWa);

    const ads = Array.isArray(adSet.ads) ? (adSet.ads as Array<Record<string, unknown>>) : [];
    ads.forEach((ad) => {
      const creative = asRecord(ad.creative);
      const story = asRecord(creative.object_story_spec);
      const storyPage = stringifyValue(story.page_id);
      if (storyPage !== "-") pageCandidates.add(storyPage);
      const videoData = asRecord(story.video_data);
      const cta = asRecord(videoData.call_to_action);
      const ctaValue = asRecord(cta.value);
      const ctaWa = stringifyValue(ctaValue.whatsapp_number || ctaValue.phone_number);
      if (ctaWa !== "-") waCandidates.add(ctaWa);
    });

    if (pageCandidates.size === 0) {
      const fallbackPage = (strategy.source_page_id || "").trim();
      if (fallbackPage) pageCandidates.add(fallbackPage);
    }

    pageCandidates.forEach((pageId) => {
      ensure(pageId);
      waCandidates.forEach((number) => ensure(pageId).add(number));
    });
  });

  const fallbackPage = (strategy.source_page_id || "").trim();
  const fallbackWa = (strategy.source_whatsapp_number || "").trim();
  if (fallbackPage) {
    ensure(fallbackPage);
    if (fallbackWa) ensure(fallbackPage).add(fallbackWa);
  }

  return Array.from(map.entries()).reduce<Record<string, string[]>>((acc, [pageId, set]) => {
    acc[pageId] = Array.from(set.values());
    return acc;
  }, {});
}

function inferCountryCode(strategy: StrategyRow): string {
  const importMetadata =
    strategy.import_metadata && typeof strategy.import_metadata === "object"
      ? (strategy.import_metadata as Record<string, unknown>)
      : {};
  const templateBuilder =
    importMetadata.template_builder && typeof importMetadata.template_builder === "object"
      ? (importMetadata.template_builder as Record<string, unknown>)
      : {};
  const original = asRecord(templateBuilder.original_payload);
  const adSets = Array.isArray(original.adSets) ? (original.adSets as Array<Record<string, unknown>>) : [];
  for (const adSet of adSets) {
    const targeting = asRecord(adSet.targeting);
    const geo = asRecord(targeting.geo_locations);
    const countries = Array.isArray(geo.countries) ? geo.countries : [];
    const found = countries.find((row) => typeof row === "string" && row.trim().length > 0);
    if (typeof found === "string") return found.trim().toUpperCase();
  }
  return "GLOBAL";
}

function buildDefaultVariableValues(
  strategy: StrategyRow,
  variables: TemplateVariable[],
  isEn: boolean
): Record<string, string> {
  const importMetadata =
    strategy.import_metadata && typeof strategy.import_metadata === "object"
      ? (strategy.import_metadata as Record<string, unknown>)
      : {};
  const templateBuilder =
    importMetadata.template_builder && typeof importMetadata.template_builder === "object"
      ? (importMetadata.template_builder as Record<string, unknown>)
      : {};
  const original = asRecord(templateBuilder.original_payload);
  const rawObjective = String(asRecord(original.campaign).objective || "");
  const objectiveLabel = isEn ? createObjectiveUiLabels(rawObjective).en : createObjectiveUiLabels(rawObjective).es;
  const country = inferCountryCode(strategy);
  const baseName = `${formatDayMonth()} - ${objectiveLabel} - ${country}`;

  return variables.reduce<Record<string, string>>((acc, variable) => {
    const key = variable.key;
    let value = variable.sampleValue || "";
    if (key === "campaign_name") value = baseName;
    const adSetMatch = key.match(/^adset_name_(\d+)$/);
    if (adSetMatch) value = `${baseName} - AdSet ${adSetMatch[1]}`;
    const adMatch = key.match(/^ad_name_(\d+)_(\d+)$/);
    if (adMatch) value = `${baseName} - Ad ${adMatch[1]}.${adMatch[2]}`;
    acc[key] = value;
    return acc;
  }, {});
}

function buildLaunchFieldSections(
  strategy: StrategyRow,
  variables: TemplateVariable[],
  isEn: boolean,
  pageNameById: Record<string, string>
): LaunchFieldSection[] {
  const importMetadata =
    strategy.import_metadata && typeof strategy.import_metadata === "object"
      ? (strategy.import_metadata as Record<string, unknown>)
      : {};
  const templateBuilder =
    importMetadata.template_builder && typeof importMetadata.template_builder === "object"
      ? (importMetadata.template_builder as Record<string, unknown>)
      : {};

  const original = asRecord(templateBuilder.original_payload);
  const templated = asRecord(templateBuilder.templated_payload);

  const originalCampaign = asRecord(original.campaign);
  const templatedCampaign = asRecord(templated.campaign);

  const originalAdSets = Array.isArray(original.adSets) ? (original.adSets as Array<Record<string, unknown>>) : [];
  const templatedAdSets = Array.isArray(templated.adSets) ? (templated.adSets as Array<Record<string, unknown>>) : [];

  const variableFieldKeys = new Set(
    variables
      .map((row) => (typeof row.fieldKey === "string" ? row.fieldKey : ""))
      .filter((value) => value.length > 0)
  );

  const isEditable = (fieldKeys: string[], templatedValues: unknown[]) =>
    fieldKeys.some((key) => variableFieldKeys.has(key)) || templatedValues.some((value) => hasTemplateToken(value));
  const resolveVariableKeys = (rowId: string): string[] => {
    const allKeys = variables.map((row) => row.key);
    const byFieldKey = (fieldKey: string) => variables.filter((row) => row.fieldKey === fieldKey).map((row) => row.key);
    if (rowId === "campaign_name") return allKeys.filter((key) => key === "campaign_name");
    if (rowId === "campaign_start_time" || rowId === "adset_start_time") return allKeys.filter((key) => key === "start_time");
    if (rowId === "campaign_budget" || rowId === "adset_budget") {
      return Array.from(new Set([...byFieldKey("budget_amount"), ...allKeys.filter((key) => key.startsWith("budget_"))]));
    }
    if (rowId === "campaign_page_id") return allKeys.filter((key) => key === "page_id");
    if (rowId === "adset_name") return allKeys.filter((key) => key.startsWith("adset_name_"));
    if (rowId === "ad_name") return allKeys.filter((key) => key.startsWith("ad_name_"));
    if (rowId === "adset_age") {
      return Array.from(new Set([...byFieldKey("targeting_age_range"), ...allKeys.filter((key) => key.startsWith("age_min") || key.startsWith("age_max"))]));
    }
    if (rowId === "adset_geo") return Array.from(new Set([...byFieldKey("targeting_geo_locations"), ...allKeys.filter((key) => key.startsWith("geo_locations"))]));
    if (rowId === "adset_whatsapp") return allKeys.filter((key) => key === "whatsapp_phone_number");
    if (rowId === "creative_title") return Array.from(new Set([...byFieldKey("creative_title"), ...allKeys.filter((key) => key.startsWith("title_"))]));
    if (rowId === "creative_body") return Array.from(new Set([...byFieldKey("creative_body"), ...allKeys.filter((key) => key.startsWith("body_"))]));
    if (rowId === "creative_cta") return Array.from(new Set([...byFieldKey("creative_call_to_action"), ...allKeys.filter((key) => key.startsWith("cta_"))]));
    if (rowId === "creative_link") return Array.from(new Set([...byFieldKey("link_url"), ...allKeys.filter((key) => key.startsWith("link_url"))]));
    if (rowId === "creative_media") {
      return Array.from(
        new Set([
          ...byFieldKey("creative_media"),
          ...allKeys.filter((key) => key.startsWith("video_id_") || key.startsWith("image_asset_")),
        ])
      );
    }
    if (rowId === "creative_instagram") {
      return Array.from(new Set([...byFieldKey("instagram_user_id"), ...allKeys.filter((key) => key.startsWith("instagram_user_id"))]));
    }
    return [];
  };

  const campaignRows: LaunchFieldRow[] = [
    {
      id: "campaign_name",
      label: "Campaign name",
      value: summarizeValues([originalCampaign.name]),
      editable: isEditable(["campaign_name"], [templatedCampaign.name]),
      variableKeys: resolveVariableKeys("campaign_name"),
    },
    {
      id: "campaign_start_time",
      label: "Start time",
      value: summarizeValues([originalCampaign.start_time]),
      editable: isEditable(["start_time"], [templatedCampaign.start_time]),
      variableKeys: resolveVariableKeys("campaign_start_time"),
    },
    {
      id: "campaign_objective",
      label: "Objective",
      value: summarizeValues([
        isEn
          ? createObjectiveUiLabels(String(originalCampaign.objective || "")).en
          : createObjectiveUiLabels(String(originalCampaign.objective || "")).es,
      ]),
      editable: false,
      variableKeys: [],
    },
    {
      id: "campaign_budget",
      label: "Budget",
      value: summarizeValues([originalCampaign.daily_budget || originalCampaign.lifetime_budget]),
      editable: isEditable(["budget_amount"], [templatedCampaign.daily_budget, templatedCampaign.lifetime_budget]),
      variableKeys: resolveVariableKeys("campaign_budget"),
    },
    {
      id: "campaign_page_id",
      label: "Page",
      value: summarizeValues([
        pageNameById[String(asRecord(originalCampaign.promoted_object).page_id || "")] ||
          asRecord(originalCampaign.promoted_object).page_id,
      ]),
      editable: isEditable(["page_id"], [asRecord(templatedCampaign.promoted_object).page_id]),
      variableKeys: resolveVariableKeys("campaign_page_id"),
    },
  ];

  const adSetRows: LaunchFieldRow[] = [
    {
      id: "adset_name",
      label: "Ad set name",
      value: summarizeValues(originalAdSets.map((row) => row.name)),
      editable: isEditable(["adset_name"], templatedAdSets.map((row) => row.name)),
      variableKeys: resolveVariableKeys("adset_name"),
    },
    {
      id: "adset_start_time",
      label: "Start time",
      value: summarizeValues(originalAdSets.map((row) => row.start_time)),
      editable: isEditable(["start_time"], templatedAdSets.map((row) => row.start_time)),
      variableKeys: resolveVariableKeys("adset_start_time"),
    },
    {
      id: "adset_budget",
      label: "Budget",
      value: summarizeValues(
        originalAdSets.map((row) => row.daily_budget || row.lifetime_budget)
      ),
      editable: isEditable(
        ["budget_amount"],
        templatedAdSets.flatMap((row) => [row.daily_budget, row.lifetime_budget])
      ),
      variableKeys: resolveVariableKeys("adset_budget"),
    },
    {
      id: "adset_age",
      label: "Age range",
      value: summarizeValues(
        originalAdSets.map((row) => {
          const targeting = asRecord(row.targeting);
          const min = targeting.age_min;
          const max = targeting.age_max;
          if (min === undefined || max === undefined) return "-";
          return `${min}-${max}`;
        })
      ),
      editable: isEditable(
        ["targeting_age_range"],
        templatedAdSets.flatMap((row) => [asRecord(row.targeting).age_min, asRecord(row.targeting).age_max])
      ),
      variableKeys: resolveVariableKeys("adset_age"),
    },
    {
      id: "adset_geo",
      label: "Geo locations",
      value: summarizeValues(originalAdSets.map((row) => asRecord(row.targeting).geo_locations)),
      editable: isEditable(
        ["targeting_geo_locations"],
        templatedAdSets.map((row) => asRecord(row.targeting).geo_locations)
      ),
      variableKeys: resolveVariableKeys("adset_geo"),
    },
    {
      id: "adset_whatsapp",
      label: "WhatsApp number",
      value: summarizeValues(
        originalAdSets.map((row) => {
          const promoted = asRecord(row.promoted_object);
          return promoted.whatsapp_phone_number || promoted.whatsapp_number;
        })
      ),
      editable: isEditable(
        ["whatsapp_phone_number"],
        templatedAdSets.map((row) => {
          const promoted = asRecord(row.promoted_object);
          return promoted.whatsapp_phone_number || promoted.whatsapp_number;
        })
      ),
      variableKeys: resolveVariableKeys("adset_whatsapp"),
    },
  ];

  const originalAds = originalAdSets.flatMap((row) => (Array.isArray(row.ads) ? (row.ads as Array<Record<string, unknown>>) : []));
  const templatedAds = templatedAdSets.flatMap((row) => (Array.isArray(row.ads) ? (row.ads as Array<Record<string, unknown>>) : []));

  const adRows: LaunchFieldRow[] = [
    {
      id: "ad_name",
      label: "Ad name",
      value: summarizeValues(originalAds.map((row) => row.name)),
      editable: isEditable(["ad_name"], templatedAds.map((row) => row.name)),
      variableKeys: resolveVariableKeys("ad_name"),
    },
    {
      id: "ad_status",
      label: "Status",
      value: summarizeValues(originalAds.map((row) => row.status)),
      editable: false,
      variableKeys: [],
    },
  ];

  const originalCreatives = originalAds.map((row) => asRecord(row.creative));
  const templatedCreatives = templatedAds.map((row) => asRecord(row.creative));

  const creativeRows: LaunchFieldRow[] = [
    {
      id: "creative_title",
      label: "Title",
      value: summarizeValues(originalCreatives.map((row) => row.title)),
      editable: isEditable(["creative_title"], templatedCreatives.map((row) => row.title)),
      variableKeys: resolveVariableKeys("creative_title"),
    },
    {
      id: "creative_body",
      label: "Primary text",
      value: summarizeValues(originalCreatives.map((row) => row.body)),
      editable: isEditable(["creative_body"], templatedCreatives.map((row) => row.body)),
      variableKeys: resolveVariableKeys("creative_body"),
    },
    {
      id: "creative_cta",
      label: "Call to action",
      value: summarizeValues(originalCreatives.map((row) => row.call_to_action)),
      editable: isEditable(["creative_call_to_action"], templatedCreatives.map((row) => row.call_to_action)),
      variableKeys: resolveVariableKeys("creative_cta"),
    },
    {
      id: "creative_link",
      label: "Link URL",
      value: summarizeValues(originalCreatives.map((row) => row.link_url)),
      editable: isEditable(["link_url"], templatedCreatives.map((row) => row.link_url)),
      variableKeys: resolveVariableKeys("creative_link"),
    },
    {
      id: "creative_media",
      label: "Media (video/image)",
      value: summarizeValues(
        originalCreatives.map((row) => row.video_id || row.image_hash || row.image_url)
      ),
      editable: isEditable(
        ["creative_media"],
        templatedCreatives.flatMap((row) => [row.video_id, row.image_hash, row.image_url])
      ),
      variableKeys: resolveVariableKeys("creative_media"),
    },
    {
      id: "creative_instagram",
      label: "Instagram user ID",
      value: summarizeValues(
        originalCreatives.map((row) => asRecord(row.object_story_spec).instagram_user_id)
      ),
      editable: isEditable(
        ["instagram_user_id"],
        templatedCreatives.map((row) => asRecord(row.object_story_spec).instagram_user_id)
      ),
      variableKeys: resolveVariableKeys("creative_instagram"),
    },
  ];

  return [
    { id: "campaign", titleEs: "Nivel campaña", titleEn: "Campaign level", rows: campaignRows },
    { id: "adset", titleEs: "Nivel ad set", titleEn: "Ad set level", rows: adSetRows },
    { id: "ad", titleEs: "Nivel anuncio", titleEn: "Ad level", rows: adRows },
    { id: "creative", titleEs: "Nivel creativo", titleEn: "Creative level", rows: creativeRows },
  ];
}

export default function Page() {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<StrategyRow[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccountRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [launchSaving, setLaunchSaving] = useState(false);
  const [launchStrategy, setLaunchStrategy] = useState<StrategyRow | null>(null);
  const [launchAdAccountId, setLaunchAdAccountId] = useState("");
  const [launchPageId, setLaunchPageId] = useState("");
  const [launchWhatsapp, setLaunchWhatsapp] = useState("");
  const [launchVariables, setLaunchVariables] = useState<TemplateVariable[]>([]);
  const [launchVariableValues, setLaunchVariableValues] = useState<Record<string, string>>({});
  const [launchFieldSections, setLaunchFieldSections] = useState<LaunchFieldSection[]>([]);
  const [pageWhatsappMap, setPageWhatsappMap] = useState<Record<string, string[]>>({});
  const [launchStep, setLaunchStep] = useState<LaunchStepId>("campaign");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const pageNameById = useMemo(
    () =>
      pages.reduce<Record<string, string>>((acc, page) => {
        acc[page.facebook_page_id] = page.name || page.facebook_page_id;
        return acc;
      }, {}),
    [pages]
  );

  const launchWhatsappOptions = useMemo(() => {
    if (!launchPageId) return [];
    return pageWhatsappMap[launchPageId] || [];
  }, [launchPageId, pageWhatsappMap]);
  const launchStepIndex = LAUNCH_STEPS.indexOf(launchStep);
  const missingVariableCount = useMemo(
    () => launchVariables.filter((row) => !(launchVariableValues[row.key] || "").trim()).length,
    [launchVariables, launchVariableValues]
  );
  const canPublish = Boolean(launchAdAccountId) && missingVariableCount === 0 && !launchSaving;

  useEffect(() => {
    if (!launchOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [launchOpen]);

  useEffect(() => {
    let mounted = true;

    const loadStrategies = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !user) {
        setError(isEn ? "Could not validate session." : "No se pudo validar la sesion.");
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      const [strategiesRes, adAccountsRes, pagesRes] = await Promise.all([
        supabase
          .from("strategies")
          .select("id,name,objective,status,created_at,completed_at,source_campaign_name,source_page_id,source_whatsapp_number,import_metadata")
          .eq("status", "COMPLETED")
          .eq("catalog_status", "PUBLISHED")
          .order("created_at", { ascending: false }),
        supabase
          .from("facebook_ad_accounts")
          .select("facebook_ad_account_id,account_id,name")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        supabase
          .from("facebook_pages")
          .select("facebook_page_id,name")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
      ]);

      if (!mounted) return;

      if (strategiesRes.error || adAccountsRes.error || pagesRes.error) {
        setError((strategiesRes.error || adAccountsRes.error || pagesRes.error)?.message || (isEn ? "Could not load data." : "No se pudieron cargar los datos."));
        setLoading(false);
        return;
      }

      setStrategies((strategiesRes.data as StrategyRow[]) || []);
      setAdAccounts((adAccountsRes.data as AdAccountRow[]) || []);
      setPages((pagesRes.data as PageRow[]) || []);
      setLoading(false);
    };

    void loadStrategies();

    return () => {
      mounted = false;
    };
  }, [isEn]);

  const openLaunchModal = (strategy: StrategyRow) => {
    setError(null);
    setSuccess(null);
    setLaunchStrategy(strategy);
    setLaunchAdAccountId("");
    const map = extractPageWhatsappMap(strategy);
    setPageWhatsappMap(map);
    const defaultPage = strategy.source_page_id || Object.keys(map)[0] || "";
    setLaunchPageId(defaultPage);
    const pageNumbers = defaultPage ? map[defaultPage] || [] : [];
    const sourceWa = strategy.source_whatsapp_number || "";
    setLaunchWhatsapp(pageNumbers.includes(sourceWa) ? sourceWa : pageNumbers[0] || sourceWa);
    const normalizedVariables = buildLaunchVariables(strategy);
    setLaunchVariables(normalizedVariables);
    setLaunchFieldSections(buildLaunchFieldSections(strategy, normalizedVariables, isEn, pageNameById));
    setLaunchVariableValues(buildDefaultVariableValues(strategy, normalizedVariables, isEn));
    setLaunchStep("campaign");
    setLaunchOpen(true);
  };

  const submitLaunchDraft = async () => {
    if (!launchStrategy || !launchAdAccountId || !currentUserId) return;

    setLaunchSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const missingVariables = launchVariables.filter((row) => !(launchVariableValues[row.key] || "").trim());
      if (missingVariables.length > 0) {
        throw new Error(
          isEn
            ? `Complete all template variables (${missingVariables.length} missing).`
            : `Completa todas las variables de la plantilla (${missingVariables.length} faltantes).`
        );
      }

      const response = await fetch("/api/strategies/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: launchStrategy.id,
          targetAdAccountId: launchAdAccountId,
          targetPageId: launchPageId || null,
          targetWhatsappNumber: launchWhatsapp || null,
          templateVariables: launchVariableValues,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        launch_id?: string;
        campaign_id?: string;
      };
      if (!response.ok) throw new Error(result.error || (isEn ? "Could not publish campaign." : "No se pudo publicar la campana."));

      setLaunchOpen(false);
      setLaunchFieldSections([]);
      setLaunchStep("campaign");
      setSuccess(
        isEn
          ? `Campaign published in Meta (paused). Campaign ID: ${result.campaign_id || "-"} | Launch ID: ${result.launch_id || "-"}`
          : `Campana publicada en Meta (pausada). Campaign ID: ${result.campaign_id || "-"} | Launch ID: ${result.launch_id || "-"}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : isEn ? "Could not publish campaign." : "No se pudo publicar la campana.";
      setError(message);
    } finally {
      setLaunchSaving(false);
    }
  };

  const isStartTimeVariable = (key: string) => key === "start_time" || key.includes("start_time");
  const updateVariableValue = (key: string, value: string) => {
    setLaunchVariableValues((prev) => ({ ...prev, [key]: value }));
  };
  const nudgeStartTimeWithWheel = (key: string, deltaY: number) => {
    const stepMinutes = 30;
    setLaunchVariableValues((prev) => ({
      ...prev,
      [key]: shiftDateTimeLocal(prev[key] || "", deltaY > 0 ? stepMinutes : -stepMinutes),
    }));
  };

  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#111827] sm:text-4xl">Ai Ads</h1>
        <p className="mt-3 text-base text-slate-600">
          {isEn ? "Launch and optimize AI-powered ads." : "Lanza y optimiza anuncios impulsados por IA."}
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[#111827]">
            {isEn ? "Published Strategies" : "Estrategias publicadas"}
          </h2>

          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
          )}

          {loading ? (
            <p className="mt-3 text-sm text-slate-600">{isEn ? "Loading..." : "Cargando..."}</p>
          ) : strategies.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              {isEn ? "No published strategies yet." : "Aun no hay estrategias publicadas."}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {strategies.map((strategy) => (
                <article key={strategy.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[#111827]">{strategy.name}</p>
                    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-slate-700">
                      {strategy.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">ID: {strategy.id}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {isEn ? "Objective" : "Objetivo"}: {strategy.objective}
                  </p>
                  {strategy.source_campaign_name && (
                    <p className="mt-1 text-xs text-slate-600">
                      {isEn ? "Source campaign" : "Campana origen"}: {strategy.source_campaign_name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {isEn ? "Imported" : "Importada"}: {" "}
                    {new Date(strategy.completed_at || strategy.created_at).toLocaleString()}
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => openLaunchModal(strategy)}
                      className="rounded-lg border border-[#16a34a] bg-green-50 px-3 py-1.5 text-xs font-semibold text-[#15803d] transition hover:bg-green-100"
                    >
                      {isEn ? "Launch campaign" : "Lanzar campaña"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {launchOpen && launchStrategy && (
        <div className="fixed inset-0 z-[120] bg-slate-950/55">
          <div className="absolute inset-0 overflow-y-auto bg-[#f3f5f9]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
                <div>
                  <h3 className="text-xl font-semibold text-[#111827]">{isEn ? "Launch campaign" : "Lanzar campaña"}</h3>
                  <p className="text-sm text-slate-600">{launchStrategy.name}</p>
                </div>
                <button
                  onClick={() => {
                    setLaunchOpen(false);
                    setLaunchFieldSections([]);
                    setLaunchStep("campaign");
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {isEn ? "Close" : "Cerrar"}
                </button>
              </div>
            </div>

            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-12">
              <section className="space-y-4 lg:col-span-7">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    {LAUNCH_STEPS.map((step, idx) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setLaunchStep(step)}
                        className={
                          step === launchStep
                            ? "rounded-full border border-[#1D293D] bg-[#1D293D] px-3 py-1 text-xs font-semibold text-white"
                            : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                        }
                      >
                        {idx + 1}. {step === "adset" ? "Ad Set" : step.charAt(0).toUpperCase() + step.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {launchFieldSections.filter((section) => section.id === launchStep).map((section) => (
                  <article key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h4 className="text-base font-semibold text-[#111827]">{isEn ? section.titleEn : section.titleEs}</h4>
                    <div className="mt-3 space-y-2">
                      {section.rows.map((row) => (
                        <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{row.label}</p>
                            <span
                              className={
                                row.editable
                                  ? "rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                                  : "rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                              }
                            >
                              {row.editable ? (isEn ? "Editable" : "Editable") : isEn ? "Locked" : "Bloqueado"}
                            </span>
                          </div>
                          {!row.editable || row.variableKeys.length === 0 ? (
                            <input
                              readOnly
                              disabled
                              value={row.value}
                              className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                            />
                          ) : (
                            <div className="mt-2 space-y-2">
                              {row.variableKeys.map((variableKey) => (
                                <div key={variableKey}>
                                  <input
                                    type={isStartTimeVariable(variableKey) ? "datetime-local" : "text"}
                                    value={
                                      isStartTimeVariable(variableKey)
                                        ? toDateTimeLocalValue(launchVariableValues[variableKey] || "")
                                        : launchVariableValues[variableKey] || ""
                                    }
                                    onChange={(event) => updateVariableValue(variableKey, event.target.value)}
                                    onWheel={(event) => {
                                      if (!isStartTimeVariable(variableKey)) return;
                                      event.preventDefault();
                                      nudgeStartTimeWithWheel(variableKey, event.deltaY);
                                    }}
                                    step={isStartTimeVariable(variableKey) ? 60 : undefined}
                                    className="mt-1 w-full rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 outline-none focus:border-green-400"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </section>

              <aside className="space-y-4 lg:col-span-5">
                {launchStep === "campaign" && (
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-base font-semibold text-[#111827]">{isEn ? "Launch settings" : "Ajustes de lanzamiento"}</h4>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {isEn ? "Ad Account" : "Ad Account"}
                      </label>
                      <select
                        value={launchAdAccountId}
                        onChange={(event) => setLaunchAdAccountId(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      >
                        <option value="">{isEn ? "Select ad account..." : "Selecciona ad account..."}</option>
                        {adAccounts.map((account) => (
                          <option key={account.facebook_ad_account_id} value={account.facebook_ad_account_id}>
                            {(account.name || "Sin nombre") + " (" + (account.account_id || account.facebook_ad_account_id) + ")"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {isEn ? "Facebook Page (optional)" : "Pagina de Facebook (opcional)"}
                      </label>
                      <select
                        value={launchPageId}
                        onChange={(event) => {
                          const nextPageId = event.target.value;
                          setLaunchPageId(nextPageId);
                          const nextNumbers = nextPageId ? pageWhatsappMap[nextPageId] || [] : [];
                          setLaunchWhatsapp((prev) => (nextNumbers.includes(prev) ? prev : nextNumbers[0] || ""));
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      >
                        <option value="">{isEn ? "No page override" : "Sin override de pagina"}</option>
                        {pages.map((page) => (
                          <option key={page.facebook_page_id} value={page.facebook_page_id}>
                            {page.name || "Sin nombre"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp</label>
                      <select
                        value={launchWhatsapp}
                        onChange={(event) => setLaunchWhatsapp(event.target.value)}
                        disabled={!launchPageId || launchWhatsappOptions.length === 0}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      >
                        {!launchPageId ? (
                          <option value="">{isEn ? "Select a page first..." : "Primero selecciona una pagina..."}</option>
                        ) : launchWhatsappOptions.length === 0 ? (
                          <option value="">{isEn ? "No numbers linked to this page" : "No hay numeros vinculados a esta pagina"}</option>
                        ) : (
                          <>
                            <option value="">{isEn ? "Select number..." : "Selecciona numero..."}</option>
                            {launchWhatsappOptions.map((number) => (
                              <option key={number} value={number}>
                                {number}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </article>
                )}

                {launchStep === "variables" && launchVariables.length > 0 && (
                  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {isEn ? "Template variables (required)" : "Variables de plantilla (requeridas)"}
                    </p>
                    <div className="mt-3 space-y-2">
                      {launchVariables.map((variable) => (
                        <div key={variable.key}>
                          <label className="text-xs font-semibold text-slate-700">
                            {isEn ? variable.labelEn || variable.key : variable.labelEs || variable.key}
                          </label>
                          <input
                            type={isStartTimeVariable(variable.key) ? "datetime-local" : "text"}
                            value={
                              isStartTimeVariable(variable.key)
                                ? toDateTimeLocalValue(launchVariableValues[variable.key] || "")
                                : launchVariableValues[variable.key] || ""
                            }
                            onChange={(event) => updateVariableValue(variable.key, event.target.value)}
                            onWheel={(event) => {
                              if (!isStartTimeVariable(variable.key)) return;
                              event.preventDefault();
                              nudgeStartTimeWithWheel(variable.key, event.deltaY);
                            }}
                            step={isStartTimeVariable(variable.key) ? 60 : undefined}
                            placeholder={variable.sampleValue || (isEn ? "Enter value..." : "Ingresa valor...")}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                          />
                          {variable.scope && <p className="mt-1 text-[11px] text-slate-500">{variable.scope}</p>}
                        </div>
                      ))}
                    </div>
                  </article>
                )}
              </aside>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-2 px-4 py-3 sm:px-6">
                <button
                  onClick={() => setLaunchStep(LAUNCH_STEPS[Math.max(launchStepIndex - 1, 0)])}
                  disabled={launchStepIndex === 0}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isEn ? "Back" : "Atras"}
                </button>
                <button
                  onClick={() => {
                    setLaunchOpen(false);
                    setLaunchFieldSections([]);
                    setLaunchStep("campaign");
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {isEn ? "Cancel" : "Cancelar"}
                </button>
                {launchStepIndex < LAUNCH_STEPS.length - 1 && (
                  <button
                    onClick={() => setLaunchStep(LAUNCH_STEPS[launchStepIndex + 1])}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {isEn ? "Next" : "Siguiente"}
                  </button>
                )}
                <button
                  onClick={() => void submitLaunchDraft()}
                  disabled={!canPublish}
                  className="rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {launchSaving
                    ? isEn
                      ? "Publishing..."
                      : "Publicando..."
                    : isEn
                      ? "Publish campaign"
                      : "Publicar campana"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

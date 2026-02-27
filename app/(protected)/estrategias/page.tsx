"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useLocale } from "../../providers/LocaleProvider";

type AdAccount = {
  facebook_ad_account_id: string;
  account_id: string | null;
  name: string | null;
  currency: string | null;
};

type MetaCampaign = {
  id: string;
  name: string;
  objective: string;
  status: string;
  effective_status: string;
  buying_type: string;
  daily_budget?: string;
  lifetime_budget?: string;
  special_ad_categories?: string[];
  bid_strategy?: string;
  created_time?: string;
  updated_time?: string;
};

type MetaCreative = {
  id?: string;
  name?: string;
  title: string;
  body: string;
  call_to_action: string;
  link_url: string;
  image_hash: string;
  image_url: string;
  video_id: string;
  thumbnail_url: string;
  url_tags: string;
  object_story_spec?: unknown;
  asset_feed_spec?: unknown;
};

type MetaAd = {
  id: string;
  name: string;
  status?: string;
  effective_status?: string;
  creative: MetaCreative;
};

type MetaAdSet = {
  id: string;
  name: string;
  start_time?: string;
  stop_time?: string;
  status?: string;
  effective_status?: string;
  optimization_goal?: string;
  billing_event?: string;
  bid_amount?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting?: unknown;
  promoted_object?: unknown;
  destination_type?: string;
  attribution_spec?: unknown;
  is_dynamic_creative?: boolean;
  ads: MetaAd[];
};

type FullCampaignData = {
  campaign: MetaCampaign & {
    promoted_object?: unknown;
    start_time?: string;
    stop_time?: string;
  };
  adSets: MetaAdSet[];
};

type StrategyObjective = "LEADS_WEBSITE" | "LEADS_FORM" | "MESSAGES_WHATSAPP";
type StrategyStatus = "DRAFT" | "COMPLETED";

type UserStrategy = {
  id: string;
  name: string;
  objective: StrategyObjective;
  status: StrategyStatus;
  catalog_status: "PRIVATE" | "PUBLISHED" | "ARCHIVED";
  created_at: string;
  completed_at: string | null;
  source_campaign_name: string | null;
};

type EditableFieldKey =
  | "creative_title"
  | "creative_body"
  | "creative_call_to_action"
  | "targeting_age_range"
  | "targeting_geo_locations"
  | "creative_media"
  | "link_url"
  | "instagram_user_id";

type EditableFieldConfig = {
  key: EditableFieldKey;
  labelEs: string;
  labelEn: string;
  adsManagerEs: string;
  adsManagerEn: string;
};

type TemplateVariable = {
  key: string;
  fieldKey: string;
  labelEs: string;
  labelEn: string;
  sampleValue: string;
  occurrences: number;
  scope: string;
};

type TemplateBuildResult = {
  templatedPayload: FullCampaignData;
  variables: TemplateVariable[];
};

const EDITABLE_FIELD_LIBRARY: EditableFieldConfig[] = [
  {
    key: "creative_title",
    labelEs: "Titulo",
    labelEn: "Headline",
    adsManagerEs: "Titulo",
    adsManagerEn: "Headline",
  },
  {
    key: "creative_body",
    labelEs: "Texto principal",
    labelEn: "Primary text",
    adsManagerEs: "Texto principal",
    adsManagerEn: "Primary text",
  },
  {
    key: "creative_call_to_action",
    labelEs: "Llamado a la accion",
    labelEn: "Call to action",
    adsManagerEs: "Boton de llamado a la accion",
    adsManagerEn: "Call-to-action button",
  },
  {
    key: "targeting_age_range",
    labelEs: "Rango de edad",
    labelEn: "Age range",
    adsManagerEs: "Edad minima y maxima",
    adsManagerEn: "Minimum and maximum age",
  },
  {
    key: "targeting_geo_locations",
    labelEs: "Ubicaciones geograficas",
    labelEn: "Geo locations",
    adsManagerEs: "Ubicaciones",
    adsManagerEn: "Locations",
  },
  {
    key: "creative_media",
    labelEs: "Media (video o imagen)",
    labelEn: "Media (video or image)",
    adsManagerEs: "Video o imagen del anuncio",
    adsManagerEn: "Ad video or image",
  },
  {
    key: "link_url",
    labelEs: "URL de destino",
    labelEn: "Destination URL",
    adsManagerEs: "URL del sitio web / enlace",
    adsManagerEn: "Website URL / link",
  },
  {
    key: "instagram_user_id",
    labelEs: "ID de Instagram",
    labelEn: "Instagram user ID",
    adsManagerEs: "Identidad de Instagram",
    adsManagerEn: "Instagram identity",
  },
];

const DEFAULT_EDITABLE_FIELDS: Record<EditableFieldKey, boolean> = {
  creative_title: false,
  creative_body: false,
  creative_call_to_action: false,
  targeting_age_range: false,
  targeting_geo_locations: false,
  creative_media: false,
  link_url: false,
  instagram_user_id: false,
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function createObjectiveUiLabels(objectiveRaw: string): { es: string; en: string } {
  const objective = (objectiveRaw || "").toUpperCase();
  if (objective === "OUTCOME_ENGAGEMENT") return { es: "Interaccion", en: "Engagement" };
  if (objective === "OUTCOME_LEADS") return { es: "Clientes potenciales", en: "Leads" };
  if (objective === "OUTCOME_SALES") return { es: "Ventas", en: "Sales" };
  if (objective === "OUTCOME_TRAFFIC") return { es: "Trafico", en: "Traffic" };
  return { es: objectiveRaw || "-", en: objectiveRaw || "-" };
}

function getInitialEditableFields(payload: FullCampaignData | null): Record<EditableFieldKey, boolean> {
  return { ...DEFAULT_EDITABLE_FIELDS };
}

function buildTemplatedPayload(
  source: FullCampaignData,
  editableFields: Record<EditableFieldKey, boolean>
): TemplateBuildResult {
  const templated = deepClone(source);
  const variables: TemplateVariable[] = [];

  // Always editable by default.
  templated.campaign.name = "{{campaign_name}}";
  variables.push({
    key: "campaign_name",
    fieldKey: "campaign_name",
    labelEs: "Nombre de campaña",
    labelEn: "Campaign name",
    sampleValue: source.campaign.name || "",
    occurrences: 1,
    scope: "campaign.name",
  });

  if (source.campaign.start_time) {
    templated.campaign.start_time = "{{start_time}}";
    let startOccurrences = 1;
    templated.adSets.forEach((adSet, idx) => {
      if (source.adSets[idx]?.start_time) {
        adSet.start_time = "{{start_time}}";
        startOccurrences += 1;
      }
    });
    variables.push({
      key: "start_time",
      fieldKey: "start_time",
      labelEs: "Fecha de inicio",
      labelEn: "Start time",
      sampleValue: source.campaign.start_time,
      occurrences: startOccurrences,
      scope: "campaign.start_time + adset.start_time",
    });
  }

  {
    // Always editable by default.
    const campaignHasDaily = Boolean(source.campaign.daily_budget && source.campaign.daily_budget !== "0");
    const campaignHasLifetime = Boolean(source.campaign.lifetime_budget && source.campaign.lifetime_budget !== "0");

    if (campaignHasDaily || campaignHasLifetime) {
      if (campaignHasDaily) templated.campaign.daily_budget = "{{budget_amount}}";
      if (campaignHasLifetime) templated.campaign.lifetime_budget = "{{budget_amount}}";
      variables.push({
        key: "budget_amount",
        fieldKey: "budget_amount",
        labelEs: "Presupuesto",
        labelEn: "Budget",
        sampleValue: campaignHasDaily ? source.campaign.daily_budget || "" : source.campaign.lifetime_budget || "",
        occurrences: 1,
        scope: campaignHasDaily ? "campaign.daily_budget" : "campaign.lifetime_budget",
      });
    } else {
      const adsetBudgetGroups = new Map<string, { value: string; type: "daily" | "lifetime"; indexes: number[] }>();
      source.adSets.forEach((adSet, index) => {
        const hasDaily = Boolean(adSet.daily_budget && adSet.daily_budget !== "0");
        const budgetType: "daily" | "lifetime" = hasDaily ? "daily" : "lifetime";
        const value = hasDaily ? adSet.daily_budget || "0" : adSet.lifetime_budget || "0";
        const groupKey = `${budgetType}:${value}`;
        const existing = adsetBudgetGroups.get(groupKey);
        if (existing) {
          existing.indexes.push(index);
        } else {
          adsetBudgetGroups.set(groupKey, { value, type: budgetType, indexes: [index] });
        }
      });

      let budgetIndex = 1;
      adsetBudgetGroups.forEach((group) => {
        const variableKey = `budget_${budgetIndex}`;
        group.indexes.forEach((idx) => {
          if (group.type === "daily") templated.adSets[idx].daily_budget = `{{${variableKey}}}`;
          if (group.type === "lifetime") templated.adSets[idx].lifetime_budget = `{{${variableKey}}}`;
        });
        variables.push({
          key: variableKey,
          fieldKey: "budget_amount",
          labelEs: "Presupuesto",
          labelEn: "Budget",
          sampleValue: group.value,
          occurrences: group.indexes.length,
          scope: group.type === "daily" ? "adset.daily_budget" : "adset.lifetime_budget",
        });
        budgetIndex += 1;
      });
    }
  }

  // Always editable by default.
  templated.adSets.forEach((adSet, adsetIndex) => {
    const adSetVar = `adset_name_${adsetIndex + 1}`;
    variables.push({
      key: adSetVar,
      fieldKey: "adset_name",
      labelEs: "Nombre de ad set",
      labelEn: "Ad set name",
      sampleValue: source.adSets[adsetIndex]?.name || "",
      occurrences: 1,
      scope: `adSets[${adsetIndex}].name`,
    });
    adSet.name = `{{${adSetVar}}}`;

    adSet.ads.forEach((ad, adIndex) => {
      const adVar = `ad_name_${adsetIndex + 1}_${adIndex + 1}`;
      variables.push({
        key: adVar,
        fieldKey: "ad_name",
        labelEs: "Nombre de anuncio",
        labelEn: "Ad name",
        sampleValue: source.adSets[adsetIndex]?.ads[adIndex]?.name || "",
        occurrences: 1,
        scope: `adSets[${adsetIndex}].ads[${adIndex}].name`,
      });
      ad.name = `{{${adVar}}}`;
    });
  });

  // Always editable by default: page_id
  let pageSample = "";
  let pageOccurrences = 0;
  const campaignPromoted = asRecord(templated.campaign.promoted_object);
  const sourceCampaignPromoted = asRecord(source.campaign.promoted_object);
  if (asString(sourceCampaignPromoted.page_id)) {
    campaignPromoted.page_id = "{{page_id}}";
    templated.campaign.promoted_object = campaignPromoted;
    pageSample = pageSample || String(sourceCampaignPromoted.page_id);
    pageOccurrences += 1;
  }
  templated.adSets.forEach((adSet, adsetIndex) => {
    const promoted = asRecord(adSet.promoted_object);
    const sourcePromoted = asRecord(source.adSets[adsetIndex]?.promoted_object);
    if (asString(sourcePromoted.page_id)) {
      promoted.page_id = "{{page_id}}";
      adSet.promoted_object = promoted;
      pageSample = pageSample || String(sourcePromoted.page_id);
      pageOccurrences += 1;
    }
    adSet.ads.forEach((ad, adIndex) => {
      const story = asRecord(ad.creative.object_story_spec);
      const sourceStory = asRecord(source.adSets[adsetIndex]?.ads[adIndex]?.creative.object_story_spec);
      if (asString(sourceStory.page_id)) {
        story.page_id = "{{page_id}}";
        ad.creative.object_story_spec = story;
        pageSample = pageSample || String(sourceStory.page_id);
        pageOccurrences += 1;
      }
    });
  });
  if (pageOccurrences > 0) {
    variables.push({
      key: "page_id",
      fieldKey: "page_id",
      labelEs: "Pagina",
      labelEn: "Page",
      sampleValue: pageSample,
      occurrences: pageOccurrences,
      scope: "promoted_object.page_id + object_story_spec.page_id",
    });
  }

  // Always editable by default for WhatsApp campaigns.
  const isWhatsappCampaign = source.adSets.some((adSet) => {
    const promoted = asRecord(adSet.promoted_object);
    return (
      (adSet.destination_type || "").toUpperCase().includes("WHATSAPP") ||
      Boolean(asString(promoted.whatsapp_phone_number)) ||
      Boolean(asString(promoted.whatsapp_number))
    );
  });
  if (isWhatsappCampaign) {
    let waSample = "";
    let waOccurrences = 0;
    templated.adSets.forEach((adSet, adsetIndex) => {
      const promoted = asRecord(adSet.promoted_object);
      const sourcePromoted = asRecord(source.adSets[adsetIndex]?.promoted_object);
      const sourceValue =
        asString(sourcePromoted.whatsapp_phone_number) ||
        asString(sourcePromoted.whatsapp_number);
      if (!sourceValue) return;
      if ("whatsapp_phone_number" in promoted) promoted.whatsapp_phone_number = "{{whatsapp_phone_number}}";
      if ("whatsapp_number" in promoted) promoted.whatsapp_number = "{{whatsapp_phone_number}}";
      adSet.promoted_object = promoted;
      waSample = waSample || sourceValue;
      waOccurrences += 1;
    });
    if (waOccurrences > 0) {
      variables.push({
        key: "whatsapp_phone_number",
        fieldKey: "whatsapp_phone_number",
        labelEs: "Numero de WhatsApp",
        labelEn: "WhatsApp number",
        sampleValue: waSample,
        occurrences: waOccurrences,
        scope: "adset.promoted_object.whatsapp_phone_number",
      });
    }
  }

  if (editableFields.targeting_age_range) {
    const ageGroups = new Map<string, number[]>();
    source.adSets.forEach((adSet, index) => {
      const targeting = asRecord(adSet.targeting);
      const ageMin = targeting.age_min;
      const ageMax = targeting.age_max;
      if (ageMin === undefined || ageMax === undefined) return;
      const key = `${ageMin}|${ageMax}`;
      if (!ageGroups.has(key)) ageGroups.set(key, []);
      ageGroups.get(key)!.push(index);
    });

    let ageIndex = 1;
    ageGroups.forEach((indexes, pairKey) => {
      const [sampleMin, sampleMax] = pairKey.split("|");
      const minVar = ageGroups.size === 1 ? "age_min" : `age_min_${ageIndex}`;
      const maxVar = ageGroups.size === 1 ? "age_max" : `age_max_${ageIndex}`;
      indexes.forEach((idx) => {
        const targeting = asRecord(templated.adSets[idx].targeting);
        targeting.age_min = `{{${minVar}}}`;
        targeting.age_max = `{{${maxVar}}}`;
        templated.adSets[idx].targeting = targeting;
      });
      variables.push({
        key: minVar,
        fieldKey: "targeting_age_range",
        labelEs: "Edad minima",
        labelEn: "Minimum age",
        sampleValue: sampleMin,
        occurrences: indexes.length,
        scope: "adset.targeting.age_min",
      });
      variables.push({
        key: maxVar,
        fieldKey: "targeting_age_range",
        labelEs: "Edad maxima",
        labelEn: "Maximum age",
        sampleValue: sampleMax,
        occurrences: indexes.length,
        scope: "adset.targeting.age_max",
      });
      ageIndex += 1;
    });
  }

  if (editableFields.targeting_geo_locations) {
    const geoGroups = new Map<string, number[]>();
    source.adSets.forEach((adSet, index) => {
      const targeting = asRecord(adSet.targeting);
      if (!targeting.geo_locations) return;
      const rawGeo = JSON.stringify(targeting.geo_locations);
      if (!geoGroups.has(rawGeo)) geoGroups.set(rawGeo, []);
      geoGroups.get(rawGeo)!.push(index);
    });

    let geoIndex = 1;
    geoGroups.forEach((indexes, rawGeo) => {
      const variableKey = geoGroups.size === 1 ? "geo_locations" : `geo_locations_${geoIndex}`;
      indexes.forEach((idx) => {
        const targeting = asRecord(templated.adSets[idx].targeting);
        targeting.geo_locations = `{{${variableKey}}}`;
        templated.adSets[idx].targeting = targeting;
      });
      variables.push({
        key: variableKey,
        fieldKey: "targeting_geo_locations",
        labelEs: "Ubicaciones geograficas",
        labelEn: "Geo locations",
        sampleValue: rawGeo,
        occurrences: indexes.length,
        scope: "adset.targeting.geo_locations",
      });
      geoIndex += 1;
    });
  }

  if (editableFields.link_url) {
    const linkGroups = new Map<string, Array<{ adsetIndex: number; adIndex: number }>>();
    source.adSets.forEach((adSet, adsetIndex) => {
      adSet.ads.forEach((ad, adIndex) => {
        const link = (ad.creative.link_url || "").trim();
        if (!link) return;
        if (!linkGroups.has(link)) linkGroups.set(link, []);
        linkGroups.get(link)!.push({ adsetIndex, adIndex });
      });
    });
    let linkIndex = 1;
    linkGroups.forEach((positions, linkValue) => {
      const key = linkGroups.size === 1 ? "link_url" : `link_url_${linkIndex}`;
      positions.forEach(({ adsetIndex, adIndex }) => {
        const ad = templated.adSets[adsetIndex].ads[adIndex];
        ad.creative.link_url = `{{${key}}}`;
        const story = asRecord(ad.creative.object_story_spec);
        const videoData = asRecord(story.video_data);
        const linkData = asRecord(story.link_data);
        if ("link" in videoData) videoData.link = `{{${key}}}`;
        if ("link" in linkData) linkData.link = `{{${key}}}`;
        const videoCta = asRecord(videoData.call_to_action);
        const videoCtaValue = asRecord(videoCta.value);
        if ("link" in videoCtaValue) videoCtaValue.link = `{{${key}}}`;
        if (Object.keys(videoCtaValue).length > 0) videoCta.value = videoCtaValue;
        if (Object.keys(videoCta).length > 0) videoData.call_to_action = videoCta;
        if (Object.keys(videoData).length > 0) story.video_data = videoData;
        if (Object.keys(linkData).length > 0) story.link_data = linkData;
        ad.creative.object_story_spec = story;
      });
      variables.push({
        key,
        fieldKey: "link_url",
        labelEs: "URL de destino",
        labelEn: "Destination URL",
        sampleValue: linkValue,
        occurrences: positions.length,
        scope: "ad.creative.link_url (+ object_story_spec link)",
      });
      linkIndex += 1;
    });
  }

  if (editableFields.instagram_user_id) {
    const igGroups = new Map<string, Array<{ adsetIndex: number; adIndex: number }>>();
    source.adSets.forEach((adSet, adsetIndex) => {
      adSet.ads.forEach((ad, adIndex) => {
        const story = asRecord(ad.creative.object_story_spec);
        const ig = asString(story.instagram_user_id);
        if (!ig) return;
        if (!igGroups.has(ig)) igGroups.set(ig, []);
        igGroups.get(ig)!.push({ adsetIndex, adIndex });
      });
    });
    let igIndex = 1;
    igGroups.forEach((positions, igValue) => {
      const key = igGroups.size === 1 ? "instagram_user_id" : `instagram_user_id_${igIndex}`;
      positions.forEach(({ adsetIndex, adIndex }) => {
        const ad = templated.adSets[adsetIndex].ads[adIndex];
        const story = asRecord(ad.creative.object_story_spec);
        story.instagram_user_id = `{{${key}}}`;
        ad.creative.object_story_spec = story;
      });
      variables.push({
        key,
        fieldKey: "instagram_user_id",
        labelEs: "ID de Instagram",
        labelEn: "Instagram user ID",
        sampleValue: igValue,
        occurrences: positions.length,
        scope: "ad.creative.object_story_spec.instagram_user_id",
      });
      igIndex += 1;
    });
  }

  if (editableFields.creative_media) {
    const mediaGroups = new Map<string, Array<{ adsetIndex: number; adIndex: number; type: "video" | "image" }>>();
    source.adSets.forEach((adSet, adsetIndex) => {
      adSet.ads.forEach((ad, adIndex) => {
        const videoId = (ad.creative.video_id || "").trim();
        const imageHash = (ad.creative.image_hash || "").trim();
        const imageUrl = (ad.creative.image_url || "").trim();
        if (videoId) {
          const key = `video:${videoId}`;
          if (!mediaGroups.has(key)) mediaGroups.set(key, []);
          mediaGroups.get(key)!.push({ adsetIndex, adIndex, type: "video" });
          return;
        }
        if (imageHash || imageUrl) {
          const imageKey = imageHash || imageUrl;
          const key = `image:${imageKey}`;
          if (!mediaGroups.has(key)) mediaGroups.set(key, []);
          mediaGroups.get(key)!.push({ adsetIndex, adIndex, type: "image" });
        }
      });
    });
    let mediaIndex = 1;
    mediaGroups.forEach((positions, rawMedia) => {
      const firstType = positions[0]?.type || "video";
      const key = firstType === "video" ? `video_id_${mediaIndex}` : `image_asset_${mediaIndex}`;
      positions.forEach(({ adsetIndex, adIndex, type }) => {
        const ad = templated.adSets[adsetIndex].ads[adIndex];
        const story = asRecord(ad.creative.object_story_spec);
        const videoData = asRecord(story.video_data);
        const linkData = asRecord(story.link_data);
        if (type === "video") {
          ad.creative.video_id = `{{${key}}}`;
          if ("video_id" in videoData) videoData.video_id = `{{${key}}}`;
        } else {
          if (ad.creative.image_hash) ad.creative.image_hash = `{{${key}}}`;
          if (ad.creative.image_url) ad.creative.image_url = `{{${key}}}`;
          if ("image_hash" in videoData) videoData.image_hash = `{{${key}}}`;
          if ("image_url" in videoData) videoData.image_url = `{{${key}}}`;
          if ("image_hash" in linkData) linkData.image_hash = `{{${key}}}`;
          if ("picture" in linkData) linkData.picture = `{{${key}}}`;
        }
        if (Object.keys(videoData).length > 0) story.video_data = videoData;
        if (Object.keys(linkData).length > 0) story.link_data = linkData;
        ad.creative.object_story_spec = story;
      });
      variables.push({
        key,
        fieldKey: "creative_media",
        labelEs: firstType === "video" ? "Video" : "Imagen",
        labelEn: firstType === "video" ? "Video" : "Image",
        sampleValue: rawMedia.replace(/^video:|^image:/, ""),
        occurrences: positions.length,
        scope: firstType === "video" ? "ad.creative.video_id" : "ad.creative.image_hash/image_url",
      });
      mediaIndex += 1;
    });
  }

  const creativeDefinitions: Array<{
    enabled: boolean;
    fieldKey: EditableFieldKey;
    labelEs: string;
    labelEn: string;
    tokenPrefix: string;
    getter: (ad: MetaAd) => string;
    setter: (ad: MetaAd, value: string) => void;
    scope: string;
  }> = [
    {
      enabled: editableFields.creative_title,
      fieldKey: "creative_title",
      labelEs: "Titulo",
      labelEn: "Headline",
      tokenPrefix: "title",
      getter: (ad) => ad.creative.title || "",
      setter: (ad, value) => {
        ad.creative.title = value;
      },
      scope: "ad.creative.title",
    },
    {
      enabled: editableFields.creative_body,
      fieldKey: "creative_body",
      labelEs: "Texto principal",
      labelEn: "Primary text",
      tokenPrefix: "body",
      getter: (ad) => ad.creative.body || "",
      setter: (ad, value) => {
        ad.creative.body = value;
      },
      scope: "ad.creative.body",
    },
    {
      enabled: editableFields.creative_call_to_action,
      fieldKey: "creative_call_to_action",
      labelEs: "Llamado a la accion",
      labelEn: "Call to action",
      tokenPrefix: "cta",
      getter: (ad) => ad.creative.call_to_action || "",
      setter: (ad, value) => {
        ad.creative.call_to_action = value;
      },
      scope: "ad.creative.call_to_action",
    },
  ];

  creativeDefinitions.forEach((definition) => {
    if (!definition.enabled) return;

    const groups = new Map<string, Array<{ adsetIndex: number; adIndex: number }>>();
    source.adSets.forEach((adSet, adsetIndex) => {
      adSet.ads.forEach((ad, adIndex) => {
        const rawValue = definition.getter(ad);
        if (!rawValue) return;
        const key = rawValue.trim();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({ adsetIndex, adIndex });
      });
    });

    let groupIndex = 1;
    groups.forEach((positions, rawValue) => {
      const variableKey = `${definition.tokenPrefix}_${groupIndex}`;
      positions.forEach(({ adsetIndex, adIndex }) => {
        const ad = templated.adSets[adsetIndex].ads[adIndex];
        definition.setter(ad, `{{${variableKey}}}`);
      });
      variables.push({
        key: variableKey,
        fieldKey: definition.fieldKey,
        labelEs: definition.labelEs,
        labelEn: definition.labelEn,
        sampleValue: rawValue,
        occurrences: positions.length,
        scope: definition.scope,
      });
      groupIndex += 1;
    });
  });

  return { templatedPayload: templated, variables };
}

function inferObjective(data: FullCampaignData): StrategyObjective {
  const campaignObjective = (data.campaign.objective || "").toUpperCase();
  const firstAdSet = data.adSets[0];
  const destination = (firstAdSet?.destination_type || "").toUpperCase();
  const promoted = asRecord(firstAdSet?.promoted_object || data.campaign.promoted_object);

  const hasWhatsapp = Boolean(asString(promoted.whatsapp_number)) || destination.includes("WHATSAPP") || campaignObjective.includes("MESSAGE");
  if (hasWhatsapp) return "MESSAGES_WHATSAPP";

  const hasLeadForm = Boolean(asString(promoted.leadgen_form_id));
  if (campaignObjective.includes("LEAD") && hasLeadForm) return "LEADS_FORM";

  return "LEADS_WEBSITE";
}

function detectUnifiedFields(data: FullCampaignData): string[] {
  const ads = data.adSets.flatMap((adSet) => adSet.ads);
  if (ads.length <= 1) return [];

  const unified: string[] = [];
  const first = ads[0];

  if (first.creative.body && ads.every((ad) => ad.creative.body === first.creative.body)) {
    unified.push("primaryText");
  }
  if (first.creative.title && ads.every((ad) => ad.creative.title === first.creative.title)) {
    unified.push("headline");
  }
  if (first.creative.call_to_action && ads.every((ad) => ad.creative.call_to_action === first.creative.call_to_action)) {
    unified.push("callToAction");
  }

  const firstMedia = first.creative.video_id || first.creative.image_hash;
  if (firstMedia && ads.every((ad) => (ad.creative.video_id || ad.creative.image_hash) === firstMedia)) {
    unified.push("media");
  }

  return unified;
}

export default function EstrategiasPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [accountDropdownDirection, setAccountDropdownDirection] = useState<"up" | "down">("down");
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);

  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignDropdownOpen, setCampaignDropdownOpen] = useState(false);
  const [campaignDropdownDirection, setCampaignDropdownDirection] = useState<"up" | "down">("down");
  const [selectedCampaign, setSelectedCampaign] = useState<MetaCampaign | null>(null);

  const [loadingFullCampaign, setLoadingFullCampaign] = useState(false);
  const [fullData, setFullData] = useState<FullCampaignData | null>(null);
  const [draftStrategyName, setDraftStrategyName] = useState("");
  const [draftStrategyNotes, setDraftStrategyNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderSaving, setBuilderSaving] = useState(false);
  const [builderStrategyId, setBuilderStrategyId] = useState<string | null>(null);
  const [builderOriginalPayload, setBuilderOriginalPayload] = useState<FullCampaignData | null>(null);
  const [editableFields, setEditableFields] = useState<Record<EditableFieldKey, boolean>>(getInitialEditableFields(null));
  const [strategies, setStrategies] = useState<UserStrategy[]>([]);
  const accountPickerRef = useRef<HTMLDivElement | null>(null);
  const campaignPickerRef = useRef<HTMLDivElement | null>(null);

  const fetchUserStrategies = useCallback(async (ownerId: string) => {
    const { data, error } = await supabase
      .from("strategies")
      .select("id,name,objective,status,catalog_status,created_at,completed_at,source_campaign_name")
      .eq("owner_user_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as UserStrategy[]) || [];
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingInit(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !user) {
        setError(isEn ? "Could not validate session." : "No se pudo validar la sesion.");
        setLoadingInit(false);
        return;
      }

      setUserId(user.id);

      const [connectionRes, accountsRes, strategiesRows] = await Promise.all([
        supabase.from("facebook_connections").select("id").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("facebook_ad_accounts")
          .select("facebook_ad_account_id,account_id,name,currency")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        fetchUserStrategies(user.id),
      ]);

      if (!mounted) return;

      if (connectionRes.error || accountsRes.error) {
        setError((connectionRes.error || accountsRes.error)?.message || (isEn ? "Could not load data." : "No se pudieron cargar los datos."));
        setLoadingInit(false);
        return;
      }

      setConnected(Boolean(connectionRes.data?.id));
      setAccounts((accountsRes.data as AdAccount[]) || []);
      setStrategies(strategiesRows);
      setLoadingInit(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [fetchUserStrategies, isEn]);

  useEffect(() => {
    const updateAccountDropdownDirection = () => {
      if (!accountPickerRef.current) return;
      const rect = accountPickerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const desiredHeight = 288;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
      setAccountDropdownDirection(openUp ? "up" : "down");
    };

    const updateCampaignDropdownDirection = () => {
      if (!campaignPickerRef.current) return;
      const rect = campaignPickerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const desiredHeight = 320;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
      setCampaignDropdownDirection(openUp ? "up" : "down");
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountPickerRef.current) return;
      if (!accountPickerRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (campaignPickerRef.current && !campaignPickerRef.current.contains(event.target as Node)) {
        setCampaignDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", updateAccountDropdownDirection);
    window.addEventListener("scroll", updateAccountDropdownDirection, true);

    if (accountDropdownOpen) updateAccountDropdownDirection();
    if (campaignDropdownOpen) updateCampaignDropdownDirection();

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", updateAccountDropdownDirection);
      window.removeEventListener("scroll", updateAccountDropdownDirection, true);
    };
  }, [accountDropdownOpen, campaignDropdownOpen]);

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts;
    const search = accountSearch.toLowerCase();
    return accounts.filter((account) => {
      const name = (account.name || "").toLowerCase();
      const id = (account.account_id || account.facebook_ad_account_id).toLowerCase();
      return name.includes(search) || id.includes(search);
    });
  }, [accounts, accountSearch]);

  const filteredCampaigns = useMemo(() => {
    if (!campaignSearch.trim()) return campaigns;
    const search = campaignSearch.toLowerCase();
    return campaigns.filter((campaign) => {
      return campaign.name.toLowerCase().includes(search) || campaign.id.includes(search);
    });
  }, [campaigns, campaignSearch]);

  const fetchCampaigns = useCallback(
    async (account: AdAccount) => {
      setSelectedAccount(account);
      setSelectedCampaign(null);
      setCampaignSearch("");
      setCampaignDropdownOpen(false);
      setFullData(null);
      setDraftStrategyName("");
      setDraftStrategyNotes("");
      setSuccess(null);
      setError(null);
      setLoadingCampaigns(true);

      try {
        const response = await fetch("/api/strategies/facebook-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "list_campaigns", adAccountId: account.facebook_ad_account_id }),
        });

        const payload = (await response.json()) as { campaigns?: MetaCampaign[]; error?: string };
        if (!response.ok) throw new Error(payload.error || (isEn ? "Could not list campaigns." : "No se pudieron listar las campanas."));

        setCampaigns(payload.campaigns || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : isEn ? "Could not list campaigns." : "No se pudieron listar las campanas.";
        setError(message);
      } finally {
        setLoadingCampaigns(false);
      }
    },
    [isEn, selectedAccount]
  );

  const fetchFullCampaign = useCallback(
    async (campaign: MetaCampaign) => {
      setSelectedCampaign(campaign);
      setFullData(null);
      setDraftStrategyName("");
      setDraftStrategyNotes("");
      setSuccess(null);
      setError(null);
      setLoadingFullCampaign(true);

      try {
        const response = await fetch("/api/strategies/facebook-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fetch_campaign", campaignId: campaign.id }),
        });

        const payload = (await response.json()) as FullCampaignData & { error?: string };
        if (!response.ok) throw new Error(payload.error || (isEn ? "Could not fetch campaign." : "No se pudo cargar la campana."));

        setFullData(payload);
        setDraftStrategyName(payload.campaign?.name || "");
        setDraftStrategyNotes(
          isEn
            ? `Imported from ${selectedAccount?.name || selectedAccount?.account_id || selectedAccount?.facebook_ad_account_id || "ad account"} · Campaign ID: ${payload.campaign?.id || campaign.id}`
            : `Importada desde ${selectedAccount?.name || selectedAccount?.account_id || selectedAccount?.facebook_ad_account_id || "ad account"} · Campaign ID: ${payload.campaign?.id || campaign.id}`
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : isEn ? "Could not fetch campaign." : "No se pudo cargar la campana.";
        setError(message);
      } finally {
        setLoadingFullCampaign(false);
      }
    },
    [isEn]
  );

  const saveStrategy = useCallback(async () => {
    if (!fullData || !selectedAccount || !userId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const firstAdSet = fullData.adSets[0];
      const promoted = asRecord(firstAdSet?.promoted_object || fullData.campaign.promoted_object);
      const unifiedFields = detectUnifiedFields(fullData);
      const totalAds = fullData.adSets.reduce((sum, row) => sum + row.ads.length, 0);
      const objective = inferObjective(fullData);
      const nowIso = new Date().toISOString();

      const structureSnapshot = {
        campaign: {
          id: fullData.campaign.id,
          name: fullData.campaign.name,
          objective: fullData.campaign.objective,
          status: fullData.campaign.status,
          effective_status: fullData.campaign.effective_status,
          buying_type: fullData.campaign.buying_type,
        },
        adsets: fullData.adSets.map((adSet) => ({
          id: adSet.id,
          name: adSet.name,
          optimization_goal: adSet.optimization_goal || null,
          billing_event: adSet.billing_event || null,
          destination_type: adSet.destination_type || null,
          ads: adSet.ads.map((ad) => ({
            id: ad.id,
            name: ad.name,
            creative_type: ad.creative.video_id ? "VIDEO" : "IMAGE",
          })),
        })),
      };

      const configSnapshot = {
        campaign: {
          buying_type: fullData.campaign.buying_type || null,
          bid_strategy: fullData.campaign.bid_strategy || null,
          daily_budget: fullData.campaign.daily_budget || null,
          lifetime_budget: fullData.campaign.lifetime_budget || null,
          special_ad_categories: fullData.campaign.special_ad_categories || [],
          start_time: fullData.campaign.start_time || null,
          stop_time: fullData.campaign.stop_time || null,
        },
        first_adset: firstAdSet
          ? {
              optimization_goal: firstAdSet.optimization_goal || null,
              billing_event: firstAdSet.billing_event || null,
              bid_amount: firstAdSet.bid_amount || null,
              daily_budget: firstAdSet.daily_budget || null,
              lifetime_budget: firstAdSet.lifetime_budget || null,
              destination_type: firstAdSet.destination_type || null,
            }
          : null,
      };

      const audienceSnapshot = {
        adsets: fullData.adSets.map((adSet) => ({
          id: adSet.id,
          name: adSet.name,
          targeting: adSet.targeting || null,
          promoted_object: adSet.promoted_object || null,
          attribution_spec: adSet.attribution_spec || null,
        })),
      };

      const creativesSnapshot = {
        unified_fields: unifiedFields,
        adsets: fullData.adSets.map((adSet) => ({
          id: adSet.id,
          name: adSet.name,
          ads: adSet.ads.map((ad) => ({
            id: ad.id,
            name: ad.name,
            creative: {
              id: ad.creative.id || null,
              title: ad.creative.title || "",
              body: ad.creative.body || "",
              call_to_action: ad.creative.call_to_action || "",
              link_url: ad.creative.link_url || "",
              image_hash: ad.creative.image_hash || "",
              image_url: ad.creative.image_url || "",
              video_id: ad.creative.video_id || "",
              thumbnail_url: ad.creative.thumbnail_url || "",
              url_tags: ad.creative.url_tags || "",
              object_story_spec: ad.creative.object_story_spec || null,
              asset_feed_spec: ad.creative.asset_feed_spec || null,
            },
          })),
        })),
      };

      const variantsSnapshot = {
        adset_count: fullData.adSets.length,
        ads_count: totalAds,
        unified_fields: unifiedFields,
        adset_breakdown: fullData.adSets.map((adSet) => ({
          id: adSet.id,
          name: adSet.name,
          ads_count: adSet.ads.length,
        })),
      };

      const treeSnapshot = {
        key: `campaign:${fullData.campaign.id}`,
        id: fullData.campaign.id,
        name: fullData.campaign.name,
        children: fullData.adSets.map((adSet) => ({
          key: `adset:${adSet.id}`,
          id: adSet.id,
          name: adSet.name,
          children: adSet.ads.map((ad) => ({
            key: `ad:${ad.id}`,
            id: ad.id,
            name: ad.name,
          })),
        })),
      };

      const payload = {
        owner_user_id: userId,
        name: draftStrategyName.trim() || fullData.campaign.name,
        description:
          draftStrategyNotes.trim() ||
          (isEn
            ? `Imported from ad account ${selectedAccount.name || selectedAccount.account_id || selectedAccount.facebook_ad_account_id}`
            : `Importada desde la ad account ${selectedAccount.name || selectedAccount.account_id || selectedAccount.facebook_ad_account_id}`),
        objective,
        status: "COMPLETED",
        completed_at: nowIso,
        audience_editable_by_buyer: true,
        source_ad_account_id: selectedAccount.facebook_ad_account_id,
        source_ad_account_name: selectedAccount.name,
        source_campaign_id: fullData.campaign.id,
        source_campaign_name: fullData.campaign.name,
        source_campaign_objective_raw: fullData.campaign.objective || null,
        source_page_id: asString(promoted.page_id),
        source_form_id: asString(promoted.leadgen_form_id),
        source_whatsapp_number: asString(promoted.whatsapp_number),
        structure_snapshot: structureSnapshot,
        config_snapshot: configSnapshot,
        audience_snapshot: audienceSnapshot,
        creatives_snapshot: creativesSnapshot,
        variants_snapshot: variantsSnapshot,
        tree_snapshot: treeSnapshot,
        import_metadata: {
          imported_at: nowIso,
          imported_by: userId,
          imported_from: "facebook_campaign",
          campaign_id: fullData.campaign.id,
          ad_account_id: selectedAccount.facebook_ad_account_id,
          ad_account_name: selectedAccount.name,
          campaign_objective_raw: fullData.campaign.objective || null,
          total_adsets: fullData.adSets.length,
          total_ads: totalAds,
        },
      };

      const { data, error: insertError } = await supabase.from("strategies").insert(payload).select("id").single();

      if (insertError) throw new Error(insertError.message);

      const createdId = (data as { id?: string } | null)?.id || null;
      if (createdId) {
        setBuilderStrategyId(createdId);
        setBuilderOriginalPayload(deepClone(fullData));
        setEditableFields(getInitialEditableFields(fullData));
        setBuilderOpen(true);
      }

      const refreshed = await fetchUserStrategies(userId);
      setStrategies(refreshed);

      // Reset import wizard state after a successful import.
      setSelectedAccount(null);
      setSelectedCampaign(null);
      setCampaigns([]);
      setFullData(null);
      setAccountSearch("");
      setCampaignSearch("");
      setDraftStrategyName("");
      setDraftStrategyNotes("");
      setAccountDropdownOpen(false);
      setCampaignDropdownOpen(false);

      setSuccess(
        isEn
          ? `Strategy imported successfully. ID: ${createdId || "-"}`
          : `Estrategia importada correctamente. ID: ${createdId || "-"}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : isEn ? "Could not save strategy." : "No se pudo guardar la estrategia.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [draftStrategyName, draftStrategyNotes, fetchUserStrategies, fullData, isEn, selectedAccount, userId]);

  const deleteStrategy = useCallback(
    async (strategyId: string) => {
      if (!userId) return;

      setDeletingId(strategyId);
      setError(null);
      setSuccess(null);

      try {
        const { error: deleteError } = await supabase.from("strategies").delete().eq("id", strategyId);
        if (deleteError) throw new Error(deleteError.message);

        const refreshed = await fetchUserStrategies(userId);
        setStrategies(refreshed);
        setSuccess(isEn ? "Strategy deleted successfully." : "Estrategia eliminada correctamente.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : isEn ? "Could not delete strategy." : "No se pudo eliminar la estrategia.";
        setError(message);
      } finally {
        setDeletingId(null);
      }
    },
    [fetchUserStrategies, isEn, userId]
  );

  const publishStrategy = useCallback(
    async (strategyId: string) => {
      if (!userId) return;

      setPublishingId(strategyId);
      setError(null);
      setSuccess(null);

      try {
        const { error: publishError } = await supabase
          .from("strategies")
          .update({ catalog_status: "PUBLISHED", published_at: new Date().toISOString() })
          .eq("id", strategyId)
          .eq("status", "COMPLETED");
        if (publishError) throw new Error(publishError.message);

        const refreshed = await fetchUserStrategies(userId);
        setStrategies(refreshed);
        setSuccess(isEn ? "Strategy published successfully." : "Estrategia publicada correctamente.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : isEn ? "Could not publish strategy." : "No se pudo publicar la estrategia.";
        setError(message);
      } finally {
        setPublishingId(null);
      }
    },
    [fetchUserStrategies, isEn, userId]
  );

  const builderPreview = useMemo(() => {
    if (!builderOriginalPayload) return null;
    return buildTemplatedPayload(builderOriginalPayload, editableFields);
  }, [builderOriginalPayload, editableFields]);

  const objectiveLabels = useMemo(() => {
    if (!builderOriginalPayload) return { es: "-", en: "-" };
    return createObjectiveUiLabels(builderOriginalPayload.campaign.objective || "");
  }, [builderOriginalPayload]);

  const saveTemplateBuilder = useCallback(async () => {
    if (!builderStrategyId || !builderOriginalPayload || !builderPreview) return;

    setBuilderSaving(true);
    setError(null);

    try {
      const { data: strategyRow, error: readError } = await supabase
        .from("strategies")
        .select("import_metadata")
        .eq("id", builderStrategyId)
        .single();
      if (readError) throw new Error(readError.message);

      const previousMetadata = asRecord(strategyRow?.import_metadata);
      const nextMetadata = {
        ...previousMetadata,
        template_builder: {
          configured_at: new Date().toISOString(),
          editable_fields: editableFields,
          variables: builderPreview.variables,
          original_payload: builderOriginalPayload,
          templated_payload: builderPreview.templatedPayload,
          field_library: EDITABLE_FIELD_LIBRARY,
        },
      };

      const { error: updateError } = await supabase
        .from("strategies")
        .update({ import_metadata: nextMetadata })
        .eq("id", builderStrategyId);
      if (updateError) throw new Error(updateError.message);

      setBuilderOpen(false);
      setBuilderStrategyId(null);
      setBuilderOriginalPayload(null);
      setEditableFields(getInitialEditableFields(null));
      setSuccess(isEn ? "Template editable fields saved." : "Campos editables de la plantilla guardados.");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isEn
            ? "Could not save template editable fields."
            : "No se pudieron guardar los campos editables de la plantilla.";
      setError(message);
    } finally {
      setBuilderSaving(false);
    }
  }, [builderOriginalPayload, builderPreview, builderStrategyId, editableFields, isEn]);

  const toggleEditableField = useCallback((key: EditableFieldKey) => {
    setEditableFields((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const totalAds = fullData ? fullData.adSets.reduce((sum, row) => sum + row.ads.length, 0) : 0;

  if (loadingInit) {
    return (
      <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-slate-600">{isEn ? "Loading..." : "Cargando..."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f5f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold text-[#111827] sm:text-4xl">{isEn ? "Strategies" : "Estrategias"}</h1>
          <p className="mt-2 text-slate-600">
            {isEn
              ? "Import an existing Meta campaign and convert it into a reusable strategy template."
              : "Importa una campana existente de Meta y conviertela en una estrategia reutilizable."}
          </p>
        </section>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-[#111827]">{isEn ? "Your Strategies" : "Tus estrategias"}</h2>
          {strategies.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              {isEn ? "No strategies yet." : "Todavia no tienes estrategias."}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {strategies.map((strategy) => (
                <article key={strategy.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#111827]">{strategy.name}</p>
                    {strategy.catalog_status === "PUBLISHED" ? (
                      <span className="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-slate-700">
                        {strategy.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">ID: {strategy.id}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {isEn ? "Objective" : "Objetivo"}: {strategy.objective}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {isEn ? "Catalog" : "Catalogo"}: {strategy.catalog_status}
                  </p>
                  {strategy.source_campaign_name && (
                    <p className="mt-1 text-xs text-slate-600">
                      {isEn ? "Source campaign" : "Campana origen"}: {strategy.source_campaign_name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {isEn ? "Created" : "Creada"}: {new Date(strategy.created_at).toLocaleString()}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {strategy.status === "COMPLETED" && strategy.catalog_status !== "PUBLISHED" && (
                      <button
                        onClick={() => void publishStrategy(strategy.id)}
                        disabled={publishingId === strategy.id}
                        className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {publishingId === strategy.id
                          ? isEn
                            ? "Publishing..."
                            : "Publicando..."
                          : isEn
                            ? "Publish"
                            : "Publicar"}
                      </button>
                    )}
                    <button
                      onClick={() => void deleteStrategy(strategy.id)}
                      disabled={deletingId === strategy.id}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === strategy.id
                        ? isEn
                          ? "Deleting..."
                          : "Eliminando..."
                        : isEn
                          ? "Delete"
                          : "Borrar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {!connected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm text-slate-600">
              {isEn
                ? "Connect Facebook to import new campaign configurations."
                : "Conecta Facebook para importar nuevas configuraciones de campanas."}
            </p>
            <a
              href="/api/facebook/oauth/start"
              className="mt-4 inline-flex items-center rounded-xl bg-[#1D293D] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {isEn ? "Connect Facebook" : "Conectar Facebook"}
            </a>
          </section>
        )}

        {connected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#111827]">1. {isEn ? "Select Ad Account" : "Selecciona Ad Account"}</h2>
            <div className="relative mt-3" ref={accountPickerRef}>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                value={accountSearch}
                onFocus={() => {
                  setAccountDropdownOpen(true);
                  if (accountPickerRef.current) {
                    const rect = accountPickerRef.current.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const desiredHeight = 288;
                    const spaceBelow = viewportHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    setAccountDropdownDirection(spaceBelow < desiredHeight && spaceAbove > spaceBelow ? "up" : "down");
                  }
                }}
                onClick={() => {
                  setAccountDropdownOpen(true);
                  if (accountPickerRef.current) {
                    const rect = accountPickerRef.current.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const desiredHeight = 288;
                    const spaceBelow = viewportHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    setAccountDropdownDirection(spaceBelow < desiredHeight && spaceAbove > spaceBelow ? "up" : "down");
                  }
                }}
                onChange={(event) => {
                  setAccountSearch(event.target.value);
                  setAccountDropdownOpen(true);
                  if (accountPickerRef.current) {
                    const rect = accountPickerRef.current.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const desiredHeight = 288;
                    const spaceBelow = viewportHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    setAccountDropdownDirection(spaceBelow < desiredHeight && spaceAbove > spaceBelow ? "up" : "down");
                  }
                }}
                placeholder={isEn ? "Search by name or account id..." : "Busca por nombre o account id..."}
              />

              {accountDropdownOpen && (
                <div
                  className={`absolute z-20 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg ${
                    accountDropdownDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
                  }`}
                >
                  {filteredAccounts.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-slate-500">
                      {isEn ? "No accounts found." : "No se encontraron cuentas."}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredAccounts.map((account) => {
                        const isActive = selectedAccount?.facebook_ad_account_id === account.facebook_ad_account_id;
                        const accountLabel = account.name || (isEn ? "No name" : "Sin nombre");
                        return (
                          <button
                            key={account.facebook_ad_account_id}
                            onClick={() => {
                              setAccountSearch(`${accountLabel} (${account.account_id || account.facebook_ad_account_id})`);
                              setAccountDropdownOpen(false);
                              void fetchCampaigns(account);
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-left transition ${
                              isActive
                                ? "border-[#1D293D] bg-slate-50"
                                : "border-transparent hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <p className="text-sm font-medium text-[#111827]">{accountLabel}</p>
                            <p className="mt-0.5 text-xs text-slate-600">{account.account_id || account.facebook_ad_account_id}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {connected && selectedAccount && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#111827]">2. {isEn ? "Select Campaign" : "Selecciona Campana"}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {selectedAccount.name || selectedAccount.account_id || selectedAccount.facebook_ad_account_id}
            </p>

            {loadingCampaigns ? (
              <p className="mt-3 text-sm text-slate-600">{isEn ? "Loading campaigns..." : "Cargando campanas..."}</p>
            ) : (
              <>
                <div className="relative mt-3" ref={campaignPickerRef}>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    value={campaignSearch}
                    onFocus={() => {
                      setCampaignDropdownOpen(true);
                      if (campaignPickerRef.current) {
                        const rect = campaignPickerRef.current.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const desiredHeight = 320;
                        const spaceBelow = viewportHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        setCampaignDropdownDirection(spaceBelow < desiredHeight && spaceAbove > spaceBelow ? "up" : "down");
                      }
                    }}
                    onClick={() => {
                      setCampaignDropdownOpen(true);
                      if (campaignPickerRef.current) {
                        const rect = campaignPickerRef.current.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const desiredHeight = 320;
                        const spaceBelow = viewportHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        setCampaignDropdownDirection(spaceBelow < desiredHeight && spaceAbove > spaceBelow ? "up" : "down");
                      }
                    }}
                    onChange={(event) => {
                      setCampaignSearch(event.target.value);
                      setCampaignDropdownOpen(true);
                      if (campaignPickerRef.current) {
                        const rect = campaignPickerRef.current.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const desiredHeight = 320;
                        const spaceBelow = viewportHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        setCampaignDropdownDirection(spaceBelow < desiredHeight && spaceAbove > spaceBelow ? "up" : "down");
                      }
                    }}
                    placeholder={isEn ? "Search campaign..." : "Buscar campana..."}
                  />

                  {campaignDropdownOpen && (
                    <div
                      className={`absolute z-20 max-h-80 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg ${
                        campaignDropdownDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
                      }`}
                    >
                      {filteredCampaigns.length === 0 ? (
                        <p className="px-2 py-2 text-sm text-slate-500">
                          {isEn ? "No campaigns found." : "No se encontraron campanas."}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {filteredCampaigns.map((campaign) => {
                            const isActive = selectedCampaign?.id === campaign.id;
                            return (
                              <button
                                key={campaign.id}
                                onClick={() => {
                                  setCampaignSearch(`${campaign.name} (${campaign.id})`);
                                  setCampaignDropdownOpen(false);
                                  void fetchFullCampaign(campaign);
                                }}
                                className={`w-full rounded-md border px-3 py-2 text-left transition ${
                                  isActive
                                    ? "border-[#1D293D] bg-slate-50"
                                    : "border-transparent hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <p className="text-sm font-medium text-[#111827]">{campaign.name}</p>
                                <p className="mt-0.5 text-xs text-slate-600">ID: {campaign.id}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {campaign.objective} • {campaign.buying_type} • {campaign.effective_status}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {connected && loadingFullCampaign && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm text-slate-600">{isEn ? "Loading campaign structure..." : "Cargando estructura de campana..."}</p>
          </section>
        )}

        {connected && fullData && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#111827]">3. {isEn ? "Review & Import" : "Revisar e importar"}</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {isEn ? "Template name" : "Nombre de plantilla"}
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  value={draftStrategyName}
                  onChange={(event) => setDraftStrategyName(event.target.value)}
                  placeholder={isEn ? "Write strategy name..." : "Escribe nombre de estrategia..."}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {isEn ? "Notes" : "Notas"}
                </label>
                <textarea
                  className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  value={draftStrategyNotes}
                  onChange={(event) => setDraftStrategyNotes(event.target.value)}
                  placeholder={isEn ? "Optional notes..." : "Notas opcionales..."}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{isEn ? "Campaign" : "Campana"}</p>
                <p className="text-sm font-medium text-[#111827]">{fullData.campaign.name}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Ad Sets</p>
                <p className="text-sm font-medium text-[#111827]">{fullData.adSets.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Ads</p>
                <p className="text-sm font-medium text-[#111827]">{totalAds}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">{isEn ? "Objective mapping" : "Mapeo de objetivo"}</p>
              <p className="mt-1 text-sm text-[#111827]">
                Meta: <strong>{fullData.campaign.objective}</strong> → Strategy: <strong>{inferObjective(fullData)}</strong>
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {fullData.adSets.map((adSet) => (
                <div key={adSet.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-[#111827]">{adSet.name}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {adSet.optimization_goal || "-"} • {adSet.billing_event || "-"} • {adSet.ads.length} ads
                  </p>
                </div>
              ))}
            </div>

            <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-[#111827]">
                {isEn ? "View all imported fields (raw)" : "Ver todos los campos importados (raw)"}
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700">
                {JSON.stringify(fullData, null, 2)}
              </pre>
            </details>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setSelectedCampaign(null);
                  setFullData(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {isEn ? "Choose another campaign" : "Elegir otra campana"}
              </button>

              <button
                onClick={() => void saveStrategy()}
                disabled={saving}
                className="rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? isEn
                    ? "Importing..."
                    : "Importando..."
                  : isEn
                    ? "Import Strategy"
                    : "Importar estrategia"}
              </button>
            </div>
          </section>
        )}
      </div>

      {builderOpen && builderOriginalPayload && builderPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-[#111827]">
                  {isEn ? "Configure Template Fields" : "Configurar campos de plantilla"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {isEn
                    ? "Map imported fields to Ads Manager terms and choose which ones will be editable for media buyers."
                    : "Mapea los campos importados a terminos de Ads Manager y elige cuales seran editables para el media buyer."}
                </p>
              </div>
              <button
                onClick={() => setBuilderOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {isEn ? "Close" : "Cerrar"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{isEn ? "Objective (Meta UI)" : "Objetivo (UI Meta)"}</p>
                <p className="text-sm font-semibold text-[#111827]">{isEn ? objectiveLabels.en : objectiveLabels.es}</p>
                <p className="text-xs text-slate-500">Raw: {builderOriginalPayload.campaign.objective || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{isEn ? "Campaign name" : "Nombre de campana"}</p>
                <p className="text-sm font-semibold text-[#111827]">{builderOriginalPayload.campaign.name}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{isEn ? "Budget mode" : "Modo de presupuesto"}</p>
                <p className="text-sm font-semibold text-[#111827]">
                  {builderOriginalPayload.campaign.daily_budget && builderOriginalPayload.campaign.daily_budget !== "0"
                    ? isEn
                      ? "Daily"
                      : "Diario"
                    : builderOriginalPayload.campaign.lifetime_budget && builderOriginalPayload.campaign.lifetime_budget !== "0"
                      ? isEn
                        ? "Lifetime"
                        : "Total"
                      : isEn
                        ? "Ad set budget"
                        : "Presupuesto por ad set"}
                </p>
              </div>
            </div>

            <section className="mt-5 rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-[#111827]">
                {isEn ? "Editable Field Library" : "Libreria de campos editables"}
              </h4>
              <p className="mt-1 text-xs text-slate-600">
                {isEn
                  ? "Always editable by default (no checkbox): campaign name, start time (campaign + ad sets), budget amount, names (campaign/ad set/ad), page_id, and whatsapp_phone_number when the campaign is WhatsApp."
                  : "Siempre editables por defecto (sin checkbox): nombre de campana, start_time (campana + ad sets), monto de presupuesto, nombres (campana/ad set/ad), page_id y whatsapp_phone_number cuando la campana es de WhatsApp."}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {EDITABLE_FIELD_LIBRARY.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={editableFields[field.key]}
                      onChange={() => toggleEditableField(field.key)}
                      className="mt-0.5"
                    />
                    <span className="block">
                      <span className="font-semibold text-[#111827]">
                        {isEn ? field.labelEn : field.labelEs}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {isEn ? field.adsManagerEn : field.adsManagerEs}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-[#111827]">
                {isEn ? "Detected Variables (grouped/unified)" : "Variables detectadas (agrupadas/unificadas)"}
              </h4>
              {builderPreview.variables.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  {isEn
                    ? "Select editable fields to generate variables."
                    : "Selecciona campos editables para generar variables."}
                </p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="px-2 py-1">Var</th>
                        <th className="px-2 py-1">{isEn ? "Field" : "Campo"}</th>
                        <th className="px-2 py-1">{isEn ? "Sample value" : "Valor ejemplo"}</th>
                        <th className="px-2 py-1">{isEn ? "Occurrences" : "Ocurrencias"}</th>
                        <th className="px-2 py-1">{isEn ? "Scope" : "Ubicacion"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {builderPreview.variables.map((variable) => (
                        <tr key={variable.key} className="border-b border-slate-100">
                          <td className="px-2 py-1 font-mono text-[#111827]">{`{{${variable.key}}}`}</td>
                          <td className="px-2 py-1">{isEn ? variable.labelEn : variable.labelEs}</td>
                          <td className="max-w-[320px] truncate px-2 py-1 text-slate-700">{variable.sampleValue}</td>
                          <td className="px-2 py-1">{variable.occurrences}</td>
                          <td className="px-2 py-1 font-mono text-slate-600">{variable.scope}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-[#111827]">
                {isEn ? "Payload with variables preview" : "Preview de payload con variables"}
              </summary>
              <pre className="mt-3 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700">
                {JSON.stringify(builderPreview.templatedPayload, null, 2)}
              </pre>
            </details>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setBuilderOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {isEn ? "Skip for now" : "Omitir por ahora"}
              </button>
              <button
                onClick={() => void saveTemplateBuilder()}
                disabled={builderSaving || !builderStrategyId}
                className="rounded-lg bg-[#1D293D] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {builderSaving
                  ? isEn
                    ? "Saving..."
                    : "Guardando..."
                  : isEn
                    ? "Save editable template"
                    : "Guardar plantilla editable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

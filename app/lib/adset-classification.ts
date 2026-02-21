export type PerformanceType = "SALES" | "LEADS" | "MESSAGING" | "AWARENESS";

export type ClassificationSource = "auto" | "manual";

export type ClassificationResult = {
  performanceType: PerformanceType;
  classificationSource: ClassificationSource;
  confidenceScore: number;
};

type Action = {
  action_type?: string;
  value?: string;
};

export type AdsetClassificationInput = {
  optimization_goal?: string | null;
  billing_event?: string | null;
  destination_type?: string | null;
  promoted_object?: Record<string, unknown> | null;
  campaign_objective?: string | null;
};

const SALES_OPTIMIZATION = new Set(["OFFSITE_CONVERSIONS", "PURCHASE", "VALUE"]);
const LEADS_OPTIMIZATION = new Set(["LEAD_GENERATION", "LEAD", "COMPLETE_REGISTRATION"]);
const MESSAGING_OPTIMIZATION = new Set([
  "MESSAGING_CONVERSATIONS",
  "CONVERSATIONS",
  "MESSAGING_CONVERSATION_STARTED",
]);
const AWARENESS_OPTIMIZATION = new Set([
  "REACH",
  "IMPRESSIONS",
  "VIDEO_VIEWS",
  "POST_ENGAGEMENT",
  "LINK_CLICKS",
  "LANDING_PAGE_VIEWS",
]);

const MESSAGING_DESTINATIONS = [
  "WHATSAPP",
  "MESSENGER",
  "INSTAGRAM_DIRECT",
  "CLICK_TO_MESSAGE",
];

const SALES_ACTIONS = ["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"];
const LEAD_ACTIONS = [
  "lead",
  "onsite_conversion.lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.lead",
];
const MESSAGING_ACTIONS = [
  "onsite_conversion.messaging_conversation_started",
  "onsite_conversion.messaging_conversation_started_7d",
  "messaging_conversation_started_7d",
  "messaging_first_reply",
  "onsite_conversion.whatsapp_message_sends",
];

function includesAny(value: string | undefined, keywords: string[]) {
  if (!value) return false;
  const upper = value.toUpperCase();
  return keywords.some((kw) => upper.includes(kw));
}

function hasLeadForm(promotedObject?: Record<string, unknown> | null) {
  if (!promotedObject) return false;

  const directCandidates = [
    "lead_gen_form_id",
    "leadgen_form_id",
    "instant_form_id",
    "lead_form_id",
  ];

  for (const key of directCandidates) {
    if (promotedObject[key]) return true;
  }

  return Object.keys(promotedObject).some((key) => key.toLowerCase().includes("lead") && Boolean(promotedObject[key]));
}

function hasAction(actions: Action[] | undefined, patterns: string[]) {
  if (!actions || actions.length === 0) return false;
  return actions.some((a) => {
    const actionType = (a.action_type || "").toLowerCase();
    return patterns.some((p) => actionType === p.toLowerCase());
  });
}

export function classifyAdset(
  adsetData: AdsetClassificationInput,
  insightsData?: { actions?: Action[] }
): ClassificationResult {
  const optimizationGoal = (adsetData.optimization_goal || "").toUpperCase();
  const destinationType = adsetData.destination_type || "";
  const campaignObjective = (adsetData.campaign_objective || "").toUpperCase();

  // STEP 2: overrides by destination or promoted object
  if (includesAny(destinationType, MESSAGING_DESTINATIONS)) {
    return { performanceType: "MESSAGING", classificationSource: "auto", confidenceScore: 96 };
  }

  if (hasLeadForm(adsetData.promoted_object || null)) {
    return { performanceType: "LEADS", classificationSource: "auto", confidenceScore: 95 };
  }

  // STEP 3: performance validation from actions
  if (hasAction(insightsData?.actions, SALES_ACTIONS)) {
    return { performanceType: "SALES", classificationSource: "auto", confidenceScore: 93 };
  }
  if (hasAction(insightsData?.actions, LEAD_ACTIONS)) {
    return { performanceType: "LEADS", classificationSource: "auto", confidenceScore: 93 };
  }
  if (hasAction(insightsData?.actions, MESSAGING_ACTIONS)) {
    return { performanceType: "MESSAGING", classificationSource: "auto", confidenceScore: 93 };
  }

  // STEP 1: primary optimization goal
  if (SALES_OPTIMIZATION.has(optimizationGoal)) {
    return { performanceType: "SALES", classificationSource: "auto", confidenceScore: 88 };
  }
  if (LEADS_OPTIMIZATION.has(optimizationGoal)) {
    return { performanceType: "LEADS", classificationSource: "auto", confidenceScore: 88 };
  }
  if (MESSAGING_OPTIMIZATION.has(optimizationGoal)) {
    return { performanceType: "MESSAGING", classificationSource: "auto", confidenceScore: 88 };
  }
  if (AWARENESS_OPTIMIZATION.has(optimizationGoal)) {
    return { performanceType: "AWARENESS", classificationSource: "auto", confidenceScore: 84 };
  }

  // campaign objective as weak signal
  if (campaignObjective.includes("MESSAGES") || campaignObjective.includes("OUTCOME_ENGAGEMENT")) {
    return { performanceType: "MESSAGING", classificationSource: "auto", confidenceScore: 70 };
  }

  // STEP 4 fallback
  return { performanceType: "AWARENESS", classificationSource: "auto", confidenceScore: 55 };
}

export function parseMessagingResultCount(actions?: Action[]) {
  if (!actions || actions.length === 0) return 0;

  return actions.reduce((sum, action) => {
    const actionType = (action.action_type || "").toLowerCase();
    const isMessaging = MESSAGING_ACTIONS.some((pattern) => actionType === pattern.toLowerCase());
    if (!isMessaging) return sum;
    return sum + Number(action.value || 0);
  }, 0);
}

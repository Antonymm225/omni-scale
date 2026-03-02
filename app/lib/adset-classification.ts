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

const SALES_OPTIMIZATION = new Set([
  "OFFSITE_CONVERSIONS",
  "VALUE",
  "PURCHASE",
  "ADD_TO_CART",
  "INITIATE_CHECKOUT",
]);

const LEADS_OPTIMIZATION = new Set([
  "LEAD_GENERATION",
  "LEAD",
  "COMPLETE_REGISTRATION",
  "CONTACT",
  "SUBSCRIBE",
  "START_TRIAL",
]);

const MESSAGING_OPTIMIZATION = new Set([
  "CONVERSATIONS",
  "MESSAGING_CONVERSATION_STARTED",
]);

const MESSAGING_DESTINATION_MARKERS = [
  "WHATSAPP",
  "MESSENGER",
  "INSTAGRAM_DIRECT",
  "MESSAGING_INSTAGRAM_DIRECT_MESSENGER",
  "MESSAGING_INSTAGRAM_DIRECT_MESSENGER_WHATSAPP",
  "MESSAGING_INSTAGRAM_DIRECT_WHATSAPP",
  "MESSAGING_MESSENGER_WHATSAPP",
];

const MESSAGING_ACTIONS = [
  "messages_started_7d",
  "onsite_conversion.messages_started_7d",
  "onsite_conversion.messaging_conversation_started",
  "onsite_conversion.messaging_conversation_started_7d",
  "messaging_conversation_started_7d",
  "messaging_first_reply",
  "onsite_conversion.whatsapp_message_sends",
];

function includesAny(value: string | undefined, keywords: string[]) {
  if (!value) return false;
  const upper = value.toUpperCase();
  return keywords.some((keyword) => upper.includes(keyword));
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function readPromotedObjectLeadSignal(promotedObject: Record<string, unknown> | null | undefined) {
  if (!promotedObject) return false;
  const promoted = asRecord(promotedObject);

  // Lead Ads form
  if (promoted.lead_ads_customization_id || promoted.lead_gen_form_id) return true;

  // Website leads (OUTCOME_LEADS -> website) commonly set custom event as LEAD
  const customEventType = String(promoted.custom_event_type || "").toUpperCase();
  if (customEventType.includes("LEAD") || customEventType === "COMPLETE_REGISTRATION") return true;

  // Some accounts include conversion event under custom_conversion / pixel config
  const pixelRule = String(promoted.pixel_rule || "").toUpperCase();
  if (pixelRule.includes("LEAD")) return true;

  return false;
}

export function classifyAdset(
  adsetData: AdsetClassificationInput,
  _insightsData?: { actions?: Action[] }
): ClassificationResult {
  const optimizationGoal = (adsetData.optimization_goal || "").toUpperCase();
  const destinationType = adsetData.destination_type || "";
  const isLeadPromotedObject = readPromotedObjectLeadSignal(adsetData.promoted_object);

  // Classification uses real optimization outcome only.
  // campaign_objective is intentionally not used to determine category.

  // 1) MENSAJES (highest priority)
  if (
    includesAny(destinationType, MESSAGING_DESTINATION_MARKERS) ||
    MESSAGING_OPTIMIZATION.has(optimizationGoal)
  ) {
    return {
      performanceType: "MESSAGING",
      classificationSource: "auto",
      confidenceScore: 96,
    };
  }

  // 2) LEADS override from promoted object (lead forms or website LEAD conversion)
  if (isLeadPromotedObject) {
    return {
      performanceType: "LEADS",
      classificationSource: "auto",
      confidenceScore: 95,
    };
  }

  // 3) VENTAS
  if (SALES_OPTIMIZATION.has(optimizationGoal)) {
    return {
      performanceType: "SALES",
      classificationSource: "auto",
      confidenceScore: 92,
    };
  }

  // 4) LEADS
  if (LEADS_OPTIMIZATION.has(optimizationGoal)) {
    return {
      performanceType: "LEADS",
      classificationSource: "auto",
      confidenceScore: 90,
    };
  }

  // 5) BRANDING fallback (stored as AWARENESS)
  return {
    performanceType: "AWARENESS",
    classificationSource: "auto",
    confidenceScore: 80,
  };
}

export function parseMessagingResultCount(actions?: Action[]) {
  if (!actions || actions.length === 0) return 0;

  // Primary metric requested for messaging performance.
  const exactMessagesStarted7d = actions
    .filter((action) => {
      const actionType = (action.action_type || "").toLowerCase();
      return (
        actionType === "messages_started_7d" ||
        actionType === "onsite_conversion.messages_started_7d"
      );
    })
    .reduce((sum, action) => sum + Number(action.value || 0), 0);

  if (exactMessagesStarted7d > 0) return exactMessagesStarted7d;

  // Fallback for accounts returning legacy messaging action types.
  return actions.reduce((sum, action) => {
    const actionType = (action.action_type || "").toLowerCase();
    const isMessaging = MESSAGING_ACTIONS.some((pattern) => actionType === pattern.toLowerCase());
    if (!isMessaging) return sum;
    return sum + Number(action.value || 0);
  }, 0);
}

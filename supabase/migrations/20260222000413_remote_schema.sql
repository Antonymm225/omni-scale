


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_onboarding"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.user_onboarding (user_id)
  values (new.id);

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user_onboarding"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_integrations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_user_integrations_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."facebook_ad_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "account_id" "text",
    "name" "text",
    "currency" "text",
    "timezone_name" "text",
    "business_id" "text",
    "business_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_ad_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_adsets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "facebook_adset_id" "text" NOT NULL,
    "campaign_id" "text",
    "campaign_name" "text",
    "name" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "performance_type" "text",
    "classification_source" "text",
    "confidence_score" integer,
    "manual_override" boolean DEFAULT false NOT NULL,
    CONSTRAINT "facebook_adsets_classification_source_check" CHECK ((("classification_source" IS NULL) OR ("classification_source" = ANY (ARRAY['auto'::"text", 'manual'::"text"])))),
    CONSTRAINT "facebook_adsets_confidence_score_check" CHECK ((("confidence_score" IS NULL) OR (("confidence_score" >= 0) AND ("confidence_score" <= 100)))),
    CONSTRAINT "facebook_adsets_performance_type_check" CHECK ((("performance_type" IS NULL) OR ("performance_type" = ANY (ARRAY['SALES'::"text", 'LEADS'::"text", 'MESSAGING'::"text", 'AWARENESS'::"text"]))))
);


ALTER TABLE "public"."facebook_adsets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_ai_runs" (
    "user_id" "uuid" NOT NULL,
    "last_ai_run_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_status" "text",
    "last_error" "text",
    "last_openai_entities" integer DEFAULT 0 NOT NULL,
    "last_total_entities" integer DEFAULT 0 NOT NULL,
    "last_slot_at" timestamp with time zone,
    "last_model" "text",
    CONSTRAINT "facebook_ai_runs_last_status_check" CHECK ((("last_status" IS NULL) OR ("last_status" = ANY (ARRAY['idle'::"text", 'running'::"text", 'completed'::"text", 'skipped'::"text", 'error'::"text"]))))
);


ALTER TABLE "public"."facebook_ai_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_branding_ad_account_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "account_id" "text",
    "account_name" "text",
    "active_campaigns_count" integer DEFAULT 0 NOT NULL,
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "is_active_account" boolean DEFAULT false NOT NULL,
    "account_status" integer,
    "spend_original" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency" "text",
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_branding_ad_account_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_branding_metrics" (
    "user_id" "uuid" NOT NULL,
    "active_accounts_count" integer DEFAULT 0 NOT NULL,
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "total_spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_results" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_branding_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_branding_timeseries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_time" timestamp with time zone NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_branding_timeseries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_business_managers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_business_id" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_business_managers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_user_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "token_expires_at" timestamp with time zone,
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "facebook_name" "text",
    "facebook_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_dashboard_ad_account_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "account_id" "text",
    "account_name" "text",
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "is_active_account" boolean DEFAULT false NOT NULL,
    "spend_original" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency" "text",
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "account_status" integer,
    "leads_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "active_campaigns_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."facebook_dashboard_ad_account_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_dashboard_metrics" (
    "user_id" "uuid" NOT NULL,
    "active_accounts_count" integer DEFAULT 0 NOT NULL,
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "total_spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_leads" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2)
);


ALTER TABLE "public"."facebook_dashboard_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_dashboard_timeseries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_time" timestamp with time zone NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "leads_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_dashboard_timeseries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_instagram_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_page_id" "text" NOT NULL,
    "instagram_account_id" "text" NOT NULL,
    "username" "text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_instagram_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_leads_ad_account_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "account_id" "text",
    "account_name" "text",
    "active_campaigns_count" integer DEFAULT 0 NOT NULL,
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "is_active_account" boolean DEFAULT false NOT NULL,
    "account_status" integer,
    "spend_original" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency" "text",
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "leads_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_leads_ad_account_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_leads_metrics" (
    "user_id" "uuid" NOT NULL,
    "active_accounts_count" integer DEFAULT 0 NOT NULL,
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "total_spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_leads" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_leads_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_leads_timeseries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_time" timestamp with time zone NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "leads_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_leads_timeseries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_messages_ad_account_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "account_id" "text",
    "account_name" "text",
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "is_active_account" boolean DEFAULT false NOT NULL,
    "account_status" integer,
    "spend_original" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency" "text",
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active_campaigns_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."facebook_messages_ad_account_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_messages_metrics" (
    "user_id" "uuid" NOT NULL,
    "active_accounts_count" integer DEFAULT 0 NOT NULL,
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "total_spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_results" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_messages_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_messages_timeseries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_time" timestamp with time zone NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_messages_timeseries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_page_id" "text" NOT NULL,
    "name" "text",
    "category" "text",
    "page_access_token" "text",
    "tasks" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_performance_monitors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "monitor_name" "text" DEFAULT 'Default Monitor'::"text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "target_scope" "text" DEFAULT 'all'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_performance_monitors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_performance_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "account_id" "text",
    "account_name" "text",
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "entity_name" "text",
    "campaign_id" "text",
    "campaign_name" "text",
    "adset_id" "text",
    "adset_name" "text",
    "ad_id" "text",
    "ad_name" "text",
    "configured_status" "text",
    "effective_status" "text",
    "spend_original" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency" "text",
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "impressions" integer DEFAULT 0 NOT NULL,
    "clicks" integer DEFAULT 0 NOT NULL,
    "ctr" numeric(10,4),
    "cpm" numeric(14,4),
    "frequency" numeric(10,4),
    "trend" "text" NOT NULL,
    "health" "text" NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "snapshot_time" timestamp with time zone NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cpc_usd" numeric(14,4),
    "ai_recommendation" "text",
    "ai_reason_short" "text",
    "ai_action" "text",
    "ai_analyzed_at" timestamp with time zone,
    "ai_model" "text",
    CONSTRAINT "facebook_performance_snapshots_ai_action_check" CHECK ((("ai_action" IS NULL) OR ("ai_action" = ANY (ARRAY['none'::"text", 'scale_up'::"text", 'pause_ad'::"text", 'pause_adset'::"text", 'pause_campaign'::"text", 'pause_account'::"text"])))),
    CONSTRAINT "facebook_performance_snapshots_ai_recommendation_check" CHECK ((("ai_recommendation" IS NULL) OR ("ai_recommendation" = ANY (ARRAY['improving'::"text", 'stable'::"text", 'scale'::"text", 'worsening'::"text"])))),
    CONSTRAINT "facebook_performance_snapshots_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['account'::"text", 'campaign'::"text", 'adset'::"text", 'ad'::"text"]))),
    CONSTRAINT "facebook_performance_snapshots_health_check" CHECK (("health" = ANY (ARRAY['good'::"text", 'watch'::"text", 'bad'::"text"]))),
    CONSTRAINT "facebook_performance_snapshots_trend_check" CHECK (("trend" = ANY (ARRAY['improving'::"text", 'stable'::"text", 'worsening'::"text"])))
);


ALTER TABLE "public"."facebook_performance_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_performance_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "account_id" "text",
    "account_name" "text",
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "entity_name" "text",
    "campaign_id" "text",
    "campaign_name" "text",
    "adset_id" "text",
    "adset_name" "text",
    "ad_id" "text",
    "ad_name" "text",
    "configured_status" "text",
    "effective_status" "text",
    "spend_original" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency" "text",
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "impressions" integer DEFAULT 0 NOT NULL,
    "clicks" integer DEFAULT 0 NOT NULL,
    "ctr" numeric(10,4),
    "cpm" numeric(14,4),
    "frequency" numeric(10,4),
    "trend" "text" NOT NULL,
    "health" "text" NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cpc_usd" numeric(14,4),
    "ai_recommendation" "text",
    "ai_reason_short" "text",
    "ai_action" "text",
    "ai_analyzed_at" timestamp with time zone,
    "ai_model" "text",
    CONSTRAINT "facebook_performance_state_ai_action_check" CHECK ((("ai_action" IS NULL) OR ("ai_action" = ANY (ARRAY['none'::"text", 'scale_up'::"text", 'pause_ad'::"text", 'pause_adset'::"text", 'pause_campaign'::"text", 'pause_account'::"text"])))),
    CONSTRAINT "facebook_performance_state_ai_recommendation_check" CHECK ((("ai_recommendation" IS NULL) OR ("ai_recommendation" = ANY (ARRAY['improving'::"text", 'stable'::"text", 'scale'::"text", 'worsening'::"text"])))),
    CONSTRAINT "facebook_performance_state_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['account'::"text", 'campaign'::"text", 'adset'::"text", 'ad'::"text"]))),
    CONSTRAINT "facebook_performance_state_health_check" CHECK (("health" = ANY (ARRAY['good'::"text", 'watch'::"text", 'bad'::"text"]))),
    CONSTRAINT "facebook_performance_state_trend_check" CHECK (("trend" = ANY (ARRAY['improving'::"text", 'stable'::"text", 'worsening'::"text"])))
);


ALTER TABLE "public"."facebook_performance_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_pixels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "facebook_pixel_id" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_pixels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_sales_ad_account_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "facebook_ad_account_id" "text" NOT NULL,
    "account_id" "text",
    "account_name" "text",
    "active_campaigns_count" integer DEFAULT 0 NOT NULL,
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "is_active_account" boolean DEFAULT false NOT NULL,
    "account_status" integer,
    "spend_original" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency" "text",
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_sales_ad_account_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_sales_metrics" (
    "user_id" "uuid" NOT NULL,
    "active_accounts_count" integer DEFAULT 0 NOT NULL,
    "active_ads_count" integer DEFAULT 0 NOT NULL,
    "total_spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_results" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_sales_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facebook_sales_timeseries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_time" timestamp with time zone NOT NULL,
    "source_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "spend_usd" numeric(14,2) DEFAULT 0 NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "cost_per_result_usd" numeric(14,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facebook_sales_timeseries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "email" "text",
    "onboarding_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_integrations" (
    "user_id" "uuid" NOT NULL,
    "everflow_api_key" "text",
    "everflow_region" "text",
    "everflow_access_type" "text",
    "openai_api_key" "text",
    "whatsapp_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_integrations_everflow_access_type_check" CHECK (("everflow_access_type" = ANY (ARRAY['Network'::"text", 'Affiliate'::"text", 'Advertiser'::"text"]))),
    CONSTRAINT "user_integrations_everflow_region_check" CHECK (("everflow_region" = ANY (ARRAY['US'::"text", 'EU'::"text"])))
);


ALTER TABLE "public"."user_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_onboarding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_name" "text",
    "business_type" "text",
    "plan" "text",
    "assets_connected" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_onboarding" OWNER TO "postgres";


ALTER TABLE ONLY "public"."facebook_ad_accounts"
    ADD CONSTRAINT "facebook_ad_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_ad_accounts"
    ADD CONSTRAINT "facebook_ad_accounts_user_id_facebook_ad_account_id_key" UNIQUE ("user_id", "facebook_ad_account_id");



ALTER TABLE ONLY "public"."facebook_adsets"
    ADD CONSTRAINT "facebook_adsets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_adsets"
    ADD CONSTRAINT "facebook_adsets_user_id_facebook_adset_id_key" UNIQUE ("user_id", "facebook_adset_id");



ALTER TABLE ONLY "public"."facebook_ai_runs"
    ADD CONSTRAINT "facebook_ai_runs_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."facebook_branding_ad_account_metrics"
    ADD CONSTRAINT "facebook_branding_ad_account__user_id_facebook_ad_account_i_key" UNIQUE ("user_id", "facebook_ad_account_id");



ALTER TABLE ONLY "public"."facebook_branding_ad_account_metrics"
    ADD CONSTRAINT "facebook_branding_ad_account_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_branding_ad_account_metrics"
    ADD CONSTRAINT "facebook_branding_ad_account_metrics_user_account_source_date_k" UNIQUE ("user_id", "facebook_ad_account_id", "source_date");



ALTER TABLE ONLY "public"."facebook_branding_metrics"
    ADD CONSTRAINT "facebook_branding_metrics_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."facebook_branding_timeseries"
    ADD CONSTRAINT "facebook_branding_timeseries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_branding_timeseries"
    ADD CONSTRAINT "facebook_branding_timeseries_user_id_snapshot_time_key" UNIQUE ("user_id", "snapshot_time");



ALTER TABLE ONLY "public"."facebook_business_managers"
    ADD CONSTRAINT "facebook_business_managers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_business_managers"
    ADD CONSTRAINT "facebook_business_managers_user_id_facebook_business_id_key" UNIQUE ("user_id", "facebook_business_id");



ALTER TABLE ONLY "public"."facebook_connections"
    ADD CONSTRAINT "facebook_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_connections"
    ADD CONSTRAINT "facebook_connections_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."facebook_dashboard_ad_account_metrics"
    ADD CONSTRAINT "facebook_dashboard_ad_account_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_dashboard_ad_account_metrics"
    ADD CONSTRAINT "facebook_dashboard_ad_account_metrics_user_account_source_date_" UNIQUE ("user_id", "facebook_ad_account_id", "source_date");



ALTER TABLE ONLY "public"."facebook_dashboard_ad_account_metrics"
    ADD CONSTRAINT "facebook_dashboard_ad_account_user_id_facebook_ad_account_i_key" UNIQUE ("user_id", "facebook_ad_account_id");



ALTER TABLE ONLY "public"."facebook_dashboard_metrics"
    ADD CONSTRAINT "facebook_dashboard_metrics_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."facebook_dashboard_timeseries"
    ADD CONSTRAINT "facebook_dashboard_timeseries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_dashboard_timeseries"
    ADD CONSTRAINT "facebook_dashboard_timeseries_user_id_snapshot_time_key" UNIQUE ("user_id", "snapshot_time");



ALTER TABLE ONLY "public"."facebook_instagram_accounts"
    ADD CONSTRAINT "facebook_instagram_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_instagram_accounts"
    ADD CONSTRAINT "facebook_instagram_accounts_user_id_instagram_account_id_key" UNIQUE ("user_id", "instagram_account_id");



ALTER TABLE ONLY "public"."facebook_leads_ad_account_metrics"
    ADD CONSTRAINT "facebook_leads_ad_account_met_user_id_facebook_ad_account_i_key" UNIQUE ("user_id", "facebook_ad_account_id");



ALTER TABLE ONLY "public"."facebook_leads_ad_account_metrics"
    ADD CONSTRAINT "facebook_leads_ad_account_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_leads_ad_account_metrics"
    ADD CONSTRAINT "facebook_leads_ad_account_metrics_user_account_source_date_key" UNIQUE ("user_id", "facebook_ad_account_id", "source_date");



ALTER TABLE ONLY "public"."facebook_leads_metrics"
    ADD CONSTRAINT "facebook_leads_metrics_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."facebook_leads_timeseries"
    ADD CONSTRAINT "facebook_leads_timeseries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_leads_timeseries"
    ADD CONSTRAINT "facebook_leads_timeseries_user_id_snapshot_time_key" UNIQUE ("user_id", "snapshot_time");



ALTER TABLE ONLY "public"."facebook_messages_ad_account_metrics"
    ADD CONSTRAINT "facebook_messages_ad_account__user_id_facebook_ad_account_i_key" UNIQUE ("user_id", "facebook_ad_account_id");



ALTER TABLE ONLY "public"."facebook_messages_ad_account_metrics"
    ADD CONSTRAINT "facebook_messages_ad_account_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_messages_ad_account_metrics"
    ADD CONSTRAINT "facebook_messages_ad_account_metrics_user_account_source_date_k" UNIQUE ("user_id", "facebook_ad_account_id", "source_date");



ALTER TABLE ONLY "public"."facebook_messages_metrics"
    ADD CONSTRAINT "facebook_messages_metrics_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."facebook_messages_timeseries"
    ADD CONSTRAINT "facebook_messages_timeseries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_messages_timeseries"
    ADD CONSTRAINT "facebook_messages_timeseries_user_id_snapshot_time_key" UNIQUE ("user_id", "snapshot_time");



ALTER TABLE ONLY "public"."facebook_pages"
    ADD CONSTRAINT "facebook_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_pages"
    ADD CONSTRAINT "facebook_pages_user_id_facebook_page_id_key" UNIQUE ("user_id", "facebook_page_id");



ALTER TABLE ONLY "public"."facebook_performance_monitors"
    ADD CONSTRAINT "facebook_performance_monitors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_performance_monitors"
    ADD CONSTRAINT "facebook_performance_monitors_user_id_monitor_name_key" UNIQUE ("user_id", "monitor_name");



ALTER TABLE ONLY "public"."facebook_performance_snapshots"
    ADD CONSTRAINT "facebook_performance_snapshot_user_id_entity_type_entity_id_key" UNIQUE ("user_id", "entity_type", "entity_id", "snapshot_time");



ALTER TABLE ONLY "public"."facebook_performance_snapshots"
    ADD CONSTRAINT "facebook_performance_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_performance_state"
    ADD CONSTRAINT "facebook_performance_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_performance_state"
    ADD CONSTRAINT "facebook_performance_state_user_id_entity_type_entity_id_key" UNIQUE ("user_id", "entity_type", "entity_id");



ALTER TABLE ONLY "public"."facebook_pixels"
    ADD CONSTRAINT "facebook_pixels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_pixels"
    ADD CONSTRAINT "facebook_pixels_user_id_facebook_pixel_id_key" UNIQUE ("user_id", "facebook_pixel_id");



ALTER TABLE ONLY "public"."facebook_sales_ad_account_metrics"
    ADD CONSTRAINT "facebook_sales_ad_account_met_user_id_facebook_ad_account_i_key" UNIQUE ("user_id", "facebook_ad_account_id");



ALTER TABLE ONLY "public"."facebook_sales_ad_account_metrics"
    ADD CONSTRAINT "facebook_sales_ad_account_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_sales_metrics"
    ADD CONSTRAINT "facebook_sales_metrics_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."facebook_sales_timeseries"
    ADD CONSTRAINT "facebook_sales_timeseries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facebook_sales_timeseries"
    ADD CONSTRAINT "facebook_sales_timeseries_user_id_snapshot_time_key" UNIQUE ("user_id", "snapshot_time");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_facebook_branding_ad_account_metrics_user_source_date" ON "public"."facebook_branding_ad_account_metrics" USING "btree" ("user_id", "source_date");



CREATE INDEX "idx_facebook_dashboard_ad_account_metrics_user_source_date" ON "public"."facebook_dashboard_ad_account_metrics" USING "btree" ("user_id", "source_date");



CREATE INDEX "idx_facebook_leads_ad_account_metrics_user_source_date" ON "public"."facebook_leads_ad_account_metrics" USING "btree" ("user_id", "source_date");



CREATE INDEX "idx_facebook_messages_ad_account_metrics_user_source_date" ON "public"."facebook_messages_ad_account_metrics" USING "btree" ("user_id", "source_date");



CREATE INDEX "idx_facebook_performance_snapshots_ai" ON "public"."facebook_performance_snapshots" USING "btree" ("user_id", "source_date", "entity_type", "ai_recommendation");



CREATE INDEX "idx_facebook_performance_snapshots_user_date" ON "public"."facebook_performance_snapshots" USING "btree" ("user_id", "source_date", "entity_type");



CREATE INDEX "idx_facebook_performance_state_ai" ON "public"."facebook_performance_state" USING "btree" ("user_id", "entity_type", "ai_recommendation");



CREATE INDEX "idx_facebook_performance_state_user_type" ON "public"."facebook_performance_state" USING "btree" ("user_id", "entity_type", "health", "trend");



CREATE OR REPLACE TRIGGER "trg_user_integrations_updated_at" BEFORE UPDATE ON "public"."user_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_integrations_updated_at"();



ALTER TABLE ONLY "public"."facebook_ad_accounts"
    ADD CONSTRAINT "facebook_ad_accounts_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."facebook_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_ad_accounts"
    ADD CONSTRAINT "facebook_ad_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_adsets"
    ADD CONSTRAINT "facebook_adsets_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."facebook_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_adsets"
    ADD CONSTRAINT "facebook_adsets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_ai_runs"
    ADD CONSTRAINT "facebook_ai_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_branding_ad_account_metrics"
    ADD CONSTRAINT "facebook_branding_ad_account_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_branding_metrics"
    ADD CONSTRAINT "facebook_branding_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_branding_timeseries"
    ADD CONSTRAINT "facebook_branding_timeseries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_business_managers"
    ADD CONSTRAINT "facebook_business_managers_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."facebook_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_business_managers"
    ADD CONSTRAINT "facebook_business_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_connections"
    ADD CONSTRAINT "facebook_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_dashboard_ad_account_metrics"
    ADD CONSTRAINT "facebook_dashboard_ad_account_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_dashboard_metrics"
    ADD CONSTRAINT "facebook_dashboard_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_dashboard_timeseries"
    ADD CONSTRAINT "facebook_dashboard_timeseries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_instagram_accounts"
    ADD CONSTRAINT "facebook_instagram_accounts_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."facebook_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_instagram_accounts"
    ADD CONSTRAINT "facebook_instagram_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_leads_ad_account_metrics"
    ADD CONSTRAINT "facebook_leads_ad_account_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_leads_metrics"
    ADD CONSTRAINT "facebook_leads_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_leads_timeseries"
    ADD CONSTRAINT "facebook_leads_timeseries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_messages_ad_account_metrics"
    ADD CONSTRAINT "facebook_messages_ad_account_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_messages_metrics"
    ADD CONSTRAINT "facebook_messages_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_messages_timeseries"
    ADD CONSTRAINT "facebook_messages_timeseries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_pages"
    ADD CONSTRAINT "facebook_pages_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."facebook_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_pages"
    ADD CONSTRAINT "facebook_pages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_performance_monitors"
    ADD CONSTRAINT "facebook_performance_monitors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_performance_snapshots"
    ADD CONSTRAINT "facebook_performance_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_performance_state"
    ADD CONSTRAINT "facebook_performance_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_pixels"
    ADD CONSTRAINT "facebook_pixels_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."facebook_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_pixels"
    ADD CONSTRAINT "facebook_pixels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_sales_ad_account_metrics"
    ADD CONSTRAINT "facebook_sales_ad_account_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_sales_metrics"
    ADD CONSTRAINT "facebook_sales_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facebook_sales_timeseries"
    ADD CONSTRAINT "facebook_sales_timeseries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Enable insert for users based on user_id" ON "public"."user_onboarding" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."user_onboarding" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users update own onboarding" ON "public"."user_onboarding" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_ad_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_ad_accounts_owner_select" ON "public"."facebook_ad_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_adsets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_adsets_owner_select" ON "public"."facebook_adsets" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_ai_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_ai_runs_owner_insert" ON "public"."facebook_ai_runs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "facebook_ai_runs_owner_select" ON "public"."facebook_ai_runs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "facebook_ai_runs_owner_update" ON "public"."facebook_ai_runs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_branding_ad_account_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_branding_ad_account_metrics_owner_select" ON "public"."facebook_branding_ad_account_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_branding_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_branding_metrics_owner_select" ON "public"."facebook_branding_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_branding_timeseries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_branding_timeseries_owner_select" ON "public"."facebook_branding_timeseries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_business_managers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_business_managers_owner_select" ON "public"."facebook_business_managers" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_connections_owner_select" ON "public"."facebook_connections" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_dashboard_ad_account_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_dashboard_ad_account_metrics_owner_select" ON "public"."facebook_dashboard_ad_account_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_dashboard_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_dashboard_metrics_owner_select" ON "public"."facebook_dashboard_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_dashboard_timeseries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_dashboard_timeseries_owner_select" ON "public"."facebook_dashboard_timeseries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_instagram_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_instagram_accounts_owner_select" ON "public"."facebook_instagram_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_leads_ad_account_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_leads_ad_account_metrics_owner_select" ON "public"."facebook_leads_ad_account_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_leads_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_leads_metrics_owner_select" ON "public"."facebook_leads_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_leads_timeseries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_leads_timeseries_owner_select" ON "public"."facebook_leads_timeseries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_messages_ad_account_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_messages_ad_account_metrics_owner_select" ON "public"."facebook_messages_ad_account_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_messages_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_messages_metrics_owner_select" ON "public"."facebook_messages_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_messages_timeseries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_messages_timeseries_owner_select" ON "public"."facebook_messages_timeseries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_pages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_pages_owner_select" ON "public"."facebook_pages" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_performance_monitors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_performance_monitors_owner_select" ON "public"."facebook_performance_monitors" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_performance_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_performance_snapshots_owner_select" ON "public"."facebook_performance_snapshots" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_performance_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_performance_state_owner_select" ON "public"."facebook_performance_state" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_pixels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_pixels_owner_select" ON "public"."facebook_pixels" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_sales_ad_account_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_sales_ad_account_metrics_owner_select" ON "public"."facebook_sales_ad_account_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_sales_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_sales_metrics_owner_select" ON "public"."facebook_sales_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."facebook_sales_timeseries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "facebook_sales_timeseries_owner_select" ON "public"."facebook_sales_timeseries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_integrations_owner_insert" ON "public"."user_integrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_integrations_owner_select" ON "public"."user_integrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_integrations_owner_update" ON "public"."user_integrations" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_onboarding" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_onboarding"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_onboarding"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_onboarding"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_integrations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_integrations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_integrations_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."facebook_ad_accounts" TO "anon";
GRANT ALL ON TABLE "public"."facebook_ad_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_ad_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_adsets" TO "anon";
GRANT ALL ON TABLE "public"."facebook_adsets" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_adsets" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_ai_runs" TO "anon";
GRANT ALL ON TABLE "public"."facebook_ai_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_ai_runs" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_branding_ad_account_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_branding_ad_account_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_branding_ad_account_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_branding_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_branding_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_branding_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_branding_timeseries" TO "anon";
GRANT ALL ON TABLE "public"."facebook_branding_timeseries" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_branding_timeseries" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_business_managers" TO "anon";
GRANT ALL ON TABLE "public"."facebook_business_managers" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_business_managers" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_connections" TO "anon";
GRANT ALL ON TABLE "public"."facebook_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_connections" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_dashboard_ad_account_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_dashboard_ad_account_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_dashboard_ad_account_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_dashboard_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_dashboard_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_dashboard_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_dashboard_timeseries" TO "anon";
GRANT ALL ON TABLE "public"."facebook_dashboard_timeseries" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_dashboard_timeseries" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_instagram_accounts" TO "anon";
GRANT ALL ON TABLE "public"."facebook_instagram_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_instagram_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_leads_ad_account_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_leads_ad_account_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_leads_ad_account_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_leads_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_leads_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_leads_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_leads_timeseries" TO "anon";
GRANT ALL ON TABLE "public"."facebook_leads_timeseries" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_leads_timeseries" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_messages_ad_account_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_messages_ad_account_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_messages_ad_account_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_messages_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_messages_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_messages_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_messages_timeseries" TO "anon";
GRANT ALL ON TABLE "public"."facebook_messages_timeseries" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_messages_timeseries" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_pages" TO "anon";
GRANT ALL ON TABLE "public"."facebook_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_pages" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_performance_monitors" TO "anon";
GRANT ALL ON TABLE "public"."facebook_performance_monitors" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_performance_monitors" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_performance_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."facebook_performance_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_performance_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_performance_state" TO "anon";
GRANT ALL ON TABLE "public"."facebook_performance_state" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_performance_state" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_pixels" TO "anon";
GRANT ALL ON TABLE "public"."facebook_pixels" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_pixels" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_sales_ad_account_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_sales_ad_account_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_sales_ad_account_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_sales_metrics" TO "anon";
GRANT ALL ON TABLE "public"."facebook_sales_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_sales_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."facebook_sales_timeseries" TO "anon";
GRANT ALL ON TABLE "public"."facebook_sales_timeseries" TO "authenticated";
GRANT ALL ON TABLE "public"."facebook_sales_timeseries" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_integrations" TO "anon";
GRANT ALL ON TABLE "public"."user_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."user_onboarding" TO "anon";
GRANT ALL ON TABLE "public"."user_onboarding" TO "authenticated";
GRANT ALL ON TABLE "public"."user_onboarding" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_onboarding AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding();


  create policy "avatars_owner_delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));



  create policy "avatars_owner_insert"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));



  create policy "avatars_owner_select"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL)));



  create policy "avatars_owner_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)))
with check (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL) AND (split_part(name, '/'::text, 1) = (auth.uid())::text)));




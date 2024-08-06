
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

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."user_role" AS ENUM (
    'USER',
    'ADMIN'
);

ALTER TYPE "public"."user_role" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."finish_bump"("task_id" "text", "final_status" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    completed_count integer;
    failed_count integer;
BEGIN
    -- Retrieve the count of completed and failed runs
    SELECT
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END),
        SUM(CASE WHEN success = false THEN 1 ELSE 0 END)
    INTO
        completed_count,
        failed_count
    FROM task_runs
    WHERE task_runs.task_id = $1;

    -- Update the bumps table with the new status and run counts
    UPDATE bumps
    SET
        status = $2,
        completed_runs = COALESCE(completed_count, 0),
        failed_runs = COALESCE(failed_count, 0)
    WHERE id = $1;
END;
$_$;

ALTER FUNCTION "public"."finish_bump"("task_id" "text", "final_status" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_wallet_secret_key"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    PERFORM
        FROM wallets
        WHERE wallets.user_id = $1;
    IF FOUND THEN
        RETURN (SELECT secret_key FROM wallets WHERE wallets.user_id = $1);
    ELSE
        RETURN 'User not found';
    END IF;
END;
$_$;

ALTER FUNCTION "public"."get_wallet_secret_key"("user_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.users (id, username, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NULLIF(LOWER(NEW.raw_user_meta_data->>'email'), '')
    );
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM
        FROM public.users
        WHERE auth.uid() = id AND role = 'ADMIN';
    RETURN FOUND;
END;
$$;

ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM
        FROM public.users
        WHERE id = user_id AND role = 'ADMIN';
    RETURN FOUND;
END;
$$;

ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_authenticated"() RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$;

ALTER FUNCTION "public"."is_authenticated"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_bumps_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_bumps_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_task_runs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_task_runs_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."bumps" (
    "id" character varying(32) NOT NULL,
    "user_id" "uuid",
    "total_runs" integer NOT NULL,
    "interval" integer NOT NULL,
    "action" "text" NOT NULL,
    "params" "jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "completed_runs" integer DEFAULT 0 NOT NULL,
    "failed_runs" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."bumps" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."task_runs" (
    "id" character varying(32) NOT NULL,
    "task_id" character varying(32),
    "success" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."task_runs" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'USER'::"public"."user_role" NOT NULL,
    "email" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "public_key" "text" NOT NULL,
    "secret_key" "text" NOT NULL
);

ALTER TABLE "public"."wallets" OWNER TO "postgres";

ALTER TABLE ONLY "public"."bumps"
    ADD CONSTRAINT "bumps_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."task_runs"
    ADD CONSTRAINT "task_runs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");

ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_bumps_user_id" ON "public"."wallets" USING "btree" ("user_id");

CREATE INDEX "idx_task_runs_task_id" ON "public"."task_runs" USING "btree" ("task_id");

CREATE INDEX "idx_wallets_user_id" ON "public"."wallets" USING "btree" ("user_id");

CREATE OR REPLACE TRIGGER "update_bumps_updated_at" BEFORE UPDATE ON "public"."bumps" FOR EACH ROW EXECUTE FUNCTION "public"."update_bumps_updated_at"();

CREATE OR REPLACE TRIGGER "update_task_runs_updated_at" BEFORE UPDATE ON "public"."task_runs" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_runs_updated_at"();

ALTER TABLE ONLY "public"."bumps"
    ADD CONSTRAINT "bumps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

CREATE POLICY "Can view bump history" ON "public"."bumps" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Can view own data and admins can view all users data" ON "public"."users" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) AS "is_admin")));

CREATE POLICY "Can view wallet address" ON "public"."wallets" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Only admins can update users data" ON "public"."users" FOR UPDATE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));

ALTER TABLE "public"."bumps" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."task_runs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."finish_bump"("task_id" "text", "final_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."finish_bump"("task_id" "text", "final_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."finish_bump"("task_id" "text", "final_status" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_wallet_secret_key"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_wallet_secret_key"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_wallet_secret_key"("user_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."is_authenticated"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_authenticated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_authenticated"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_bumps_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_bumps_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bumps_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_task_runs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_task_runs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_task_runs_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON TABLE "public"."bumps" TO "anon";
GRANT ALL ON TABLE "public"."bumps" TO "authenticated";
GRANT ALL ON TABLE "public"."bumps" TO "service_role";

GRANT ALL ON TABLE "public"."task_runs" TO "anon";
GRANT ALL ON TABLE "public"."task_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."task_runs" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;

--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


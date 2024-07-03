SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Ubuntu 15.1-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.7 (Ubuntu 15.7-1.pgdg20.04+1)

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '883563a1-3b07-4a72-a8a5-320638e58a3e', '{"action":"user_signedup","actor_id":"77d371fe-d68c-4f61-940e-c3bdf4e2492d","actor_username":"cryptobumper42@fakemail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2024-07-04 00:19:36.519502+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b1c691f3-80f2-40e4-8bb9-157f1d254bcf', '{"action":"login","actor_id":"77d371fe-d68c-4f61-940e-c3bdf4e2492d","actor_username":"cryptobumper42@fakemail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2024-07-04 00:19:36.52382+00', ''),
	('00000000-0000-0000-0000-000000000000', '5599e04c-9341-496f-9b0a-d0d8b971bd6a', '{"action":"logout","actor_id":"77d371fe-d68c-4f61-940e-c3bdf4e2492d","actor_username":"cryptobumper42@fakemail.com","actor_via_sso":false,"log_type":"account"}', '2024-07-04 00:19:41.377341+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c41b2b60-7a9b-4123-877f-9532a8cbf173', '{"action":"user_signedup","actor_id":"d26b2543-e821-4374-8f35-e3eb6b71b04b","actor_username":"testuser@fakemail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2024-07-04 00:19:47.768595+00', ''),
	('00000000-0000-0000-0000-000000000000', '01ac09aa-7afc-461f-9b7a-be64629ac52a', '{"action":"login","actor_id":"d26b2543-e821-4374-8f35-e3eb6b71b04b","actor_username":"testuser@fakemail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2024-07-04 00:19:47.772381+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da4915cf-caf4-4a9b-aa79-6174d0b31522', '{"action":"logout","actor_id":"d26b2543-e821-4374-8f35-e3eb6b71b04b","actor_username":"testuser@fakemail.com","actor_via_sso":false,"log_type":"account"}', '2024-07-04 00:19:49.460057+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '77d371fe-d68c-4f61-940e-c3bdf4e2492d', 'authenticated', 'authenticated', 'cryptobumper42@fakemail.com', '$2a$10$6xOYnh3WjNUTRa0tBPzOLe/2uSvsIbxso7mqkzv7Lp/b2NtxNes8y', '2024-07-04 00:19:36.520089+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-07-04 00:19:36.524122+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "77d371fe-d68c-4f61-940e-c3bdf4e2492d", "email": "cryptobumper42@fakemail.com", "username": "cryptobumper42", "email_verified": false, "phone_verified": false}', NULL, '2024-07-04 00:19:36.514309+00', '2024-07-04 00:19:36.526423+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd26b2543-e821-4374-8f35-e3eb6b71b04b', 'authenticated', 'authenticated', 'testuser@fakemail.com', '$2a$10$QXFMjzGSEUaE51ErnxYXLe0GMVFm2fn7Xwpda7Mm/RVDgj48.kIEi', '2024-07-04 00:19:47.768989+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-07-04 00:19:47.772816+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "d26b2543-e821-4374-8f35-e3eb6b71b04b", "email": "testuser@fakemail.com", "username": "testuser", "email_verified": false, "phone_verified": false}', NULL, '2024-07-04 00:19:47.765534+00', '2024-07-04 00:19:47.773812+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('77d371fe-d68c-4f61-940e-c3bdf4e2492d', '77d371fe-d68c-4f61-940e-c3bdf4e2492d', '{"sub": "77d371fe-d68c-4f61-940e-c3bdf4e2492d", "email": "cryptobumper42@fakemail.com", "username": "cryptobumper42", "email_verified": false, "phone_verified": false}', 'email', '2024-07-04 00:19:36.517605+00', '2024-07-04 00:19:36.517625+00', '2024-07-04 00:19:36.517625+00', '20dd42ec-a182-42aa-88d1-23c229318dc7'),
	('d26b2543-e821-4374-8f35-e3eb6b71b04b', 'd26b2543-e821-4374-8f35-e3eb6b71b04b', '{"sub": "d26b2543-e821-4374-8f35-e3eb6b71b04b", "email": "testuser@fakemail.com", "username": "testuser", "email_verified": false, "phone_verified": false}', 'email', '2024-07-04 00:19:47.767202+00', '2024-07-04 00:19:47.76722+00', '2024-07-04 00:19:47.76722+00', '4100796d-6a92-4965-9846-5c372caf602b');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "username", "role", "email", "active", "created_at", "updated_at") VALUES
	('77d371fe-d68c-4f61-940e-c3bdf4e2492d', 'cryptobumper42', 'USER', 'cryptobumper42@mail.com', true, '2024-07-04 00:19:36.514055+00', '2024-07-04 00:19:36.514055+00'),
	('d26b2543-e821-4374-8f35-e3eb6b71b04b', 'testuser', 'USER', NULL, true, '2024-07-04 00:19:47.765275+00', '2024-07-04 00:19:47.765275+00');


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."wallets" ("id", "user_id", "public_key", "secret_key") VALUES
	('a05e886d-dc72-45c7-b0bd-d8625b9f1e9f', '77d371fe-d68c-4f61-940e-c3bdf4e2492d', 'Geq6DbrDwTX6k5wabA2ddYjHUEKayobVW3hi2Xu7KUE1', '5tepWV1BR4jrTcbyc7o7CVLSajgESy1Ve36DfEqWhHsbg3ghhCPHx6QYZNk9Ymjj9MmfZVCmdEsj7R51zzZeCf6m'),
	('394f3f56-5da5-4f95-9861-e52df8101f6a', 'd26b2543-e821-4374-8f35-e3eb6b71b04b', '7bUGvmSL2SEuZXQRRqGfAXL9PTEP1mjJMeBZTQFCHGC8', '3PhXfXD6v8RRnYR7C7j4Fbor8cWtAHvLM6TbyEGa6cCqsKkAiTL9LXnCyCKRjAihfSSc89RAS4f3wYDot815UUDN');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 2, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;

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
	('00000000-0000-0000-0000-000000000000', '30fd2287-de23-4209-9ade-5eda1fb2dfaa', '{"action":"user_signedup","actor_id":"d88945cc-10ac-40b5-bb25-ee58b3575ce4","actor_username":"cryptobumper42@fakemail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2024-06-30 02:29:11.459236+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d873ec1-b275-47f1-9758-c12fad0479c9', '{"action":"login","actor_id":"d88945cc-10ac-40b5-bb25-ee58b3575ce4","actor_username":"cryptobumper42@fakemail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2024-06-30 02:29:11.463704+00', ''),
	('00000000-0000-0000-0000-000000000000', '39844117-14fc-43cc-8e85-d7fafff0c489', '{"action":"logout","actor_id":"d88945cc-10ac-40b5-bb25-ee58b3575ce4","actor_username":"cryptobumper42@fakemail.com","actor_via_sso":false,"log_type":"account"}', '2024-06-30 02:29:15.996789+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dfd3ae61-a19a-4608-9b0a-a085b152efc2', '{"action":"user_signedup","actor_id":"d2d92465-db5e-4894-816a-95a0292bc3f4","actor_username":"testuser@fakemail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2024-06-30 02:29:20.685928+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c3d6e84d-2fe5-4de9-9885-69abd6f5f57f', '{"action":"login","actor_id":"d2d92465-db5e-4894-816a-95a0292bc3f4","actor_username":"testuser@fakemail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2024-06-30 02:29:20.689259+00', ''),
	('00000000-0000-0000-0000-000000000000', '64a4bd57-bdfa-4a03-9f7e-ccb1cf8dd3b4', '{"action":"logout","actor_id":"d2d92465-db5e-4894-816a-95a0292bc3f4","actor_username":"testuser@fakemail.com","actor_via_sso":false,"log_type":"account"}', '2024-06-30 02:29:22.51118+00', '');


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'd88945cc-10ac-40b5-bb25-ee58b3575ce4', 'authenticated', 'authenticated', 'cryptobumper42@fakemail.com', '$2a$10$VKYudhWcXVhED95jnWrpmu9DgwTVLNVvr65r5ZnIlFWCo1QdLP.q6', '2024-06-30 02:29:11.459789+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-06-30 02:29:11.464169+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "d88945cc-10ac-40b5-bb25-ee58b3575ce4", "email": "cryptobumper42@fakemail.com", "username": "cryptobumper42", "email_verified": false, "phone_verified": false}', NULL, '2024-06-30 02:29:11.453808+00', '2024-06-30 02:29:11.466069+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd2d92465-db5e-4894-816a-95a0292bc3f4', 'authenticated', 'authenticated', 'testuser@fakemail.com', '$2a$10$rl9wbg1HVHlLDjcdEs4Q2.NgAE2cU43oT35JLVATYNCH9bCinRosO', '2024-06-30 02:29:20.686357+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-06-30 02:29:20.689649+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "d2d92465-db5e-4894-816a-95a0292bc3f4", "email": "testuser@fakemail.com", "username": "testuser", "email_verified": false, "phone_verified": false}', NULL, '2024-06-30 02:29:20.682616+00', '2024-06-30 02:29:20.690737+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('d88945cc-10ac-40b5-bb25-ee58b3575ce4', 'd88945cc-10ac-40b5-bb25-ee58b3575ce4', '{"sub": "d88945cc-10ac-40b5-bb25-ee58b3575ce4", "email": "cryptobumper42@fakemail.com", "username": "cryptobumper42", "email_verified": false, "phone_verified": false}', 'email', '2024-06-30 02:29:11.457275+00', '2024-06-30 02:29:11.457301+00', '2024-06-30 02:29:11.457301+00', 'c028bdde-6cfe-4c51-89fd-71357db85372'),
	('d2d92465-db5e-4894-816a-95a0292bc3f4', 'd2d92465-db5e-4894-816a-95a0292bc3f4', '{"sub": "d2d92465-db5e-4894-816a-95a0292bc3f4", "email": "testuser@fakemail.com", "username": "testuser", "email_verified": false, "phone_verified": false}', 'email', '2024-06-30 02:29:20.684434+00', '2024-06-30 02:29:20.68446+00', '2024-06-30 02:29:20.68446+00', 'cb236fbe-79be-4a7c-b17f-3f7b64389e14');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "username", "role", "email", "active", "created_at", "updated_at") VALUES
	('d88945cc-10ac-40b5-bb25-ee58b3575ce4', 'cryptobumper42', 'USER', 'cryptobumper42@mail.com', true, '2024-06-30 02:29:11.453553+00', '2024-06-30 02:29:11.453553+00'),
	('d2d92465-db5e-4894-816a-95a0292bc3f4', 'testuser', 'USER', NULL, true, '2024-06-30 02:29:20.682361+00', '2024-06-30 02:29:20.682361+00');


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."wallets" ("id", "public_key", "secret_key") VALUES
	('d88945cc-10ac-40b5-bb25-ee58b3575ce4', 'BP8gm3fnZsULD9WffuS1pVwpSPLRY3LP6nkJBKANKosg', '2vi8nD9WFSmyQumvSnEjJtbSF1CCH2y1mhuZ4kpe49qkbTq1WmG2xJenDUtLmFsqfKT9GahoKKGpVxpNKpQ74YgA'),
	('d2d92465-db5e-4894-816a-95a0292bc3f4', '93wceqiJNB3RTbifis5MxFNtpzxButyW3vDqRrpPoauE', '5aHyrknW3YMS6gdhFU7T4nhNaGWY97PVGfeayBzVmtfGBGgat3ZenR3iuNTX8xDumTmng9PfD3kad8hBZvmfd5ZS');


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

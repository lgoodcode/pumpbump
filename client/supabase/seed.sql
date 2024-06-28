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




INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'b30ca799-a801-4efc-8cb8-486cde6688c9', 'authenticated', 'authenticated', 'testuser@fakemail.com', '$2a$10$WrD6npQxR70LHW9jmDTdy.YHK.qDClAa21/5Ti86NKW/3tE84lLHa', '2024-06-27 19:26:28.53361+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-06-27 23:42:13.382341+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "b30ca799-a801-4efc-8cb8-486cde6688c9", "email": "testuser@fakemail.com", "username": "testuser", "email_verified": false, "phone_verified": false}', NULL, '2024-06-27 19:26:28.529362+00', '2024-06-27 23:42:13.383426+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '53858ae2-ef53-401e-84cb-f3dfd32f1ef1', 'authenticated', 'authenticated', 'cryptobumper42@fakemail.com', '$2a$10$dAQgXPXuf5j2IqqW4Zw1DuAgvkOsMLtL/xpeFugZNQHc8rQFa.2im', '2024-06-27 06:46:35.554759+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-06-27 23:42:16.919373+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "53858ae2-ef53-401e-84cb-f3dfd32f1ef1", "email": "cryptobumper42@fakemail.com", "username": "cryptobumper42", "email_verified": false, "phone_verified": false}', NULL, '2024-06-27 06:46:35.547023+00', '2024-06-28 01:14:23.910708+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('53858ae2-ef53-401e-84cb-f3dfd32f1ef1', '53858ae2-ef53-401e-84cb-f3dfd32f1ef1', '{"sub": "53858ae2-ef53-401e-84cb-f3dfd32f1ef1", "email": "cryptobumper42@fakemail.com", "username": "cryptobumper42", "email_verified": false, "phone_verified": false}', 'email', '2024-06-27 06:46:35.552208+00', '2024-06-27 06:46:35.55223+00', '2024-06-27 06:46:35.55223+00', '3c48ef5d-30f2-49aa-9048-04c1cdf0dc9c'),
	('b30ca799-a801-4efc-8cb8-486cde6688c9', 'b30ca799-a801-4efc-8cb8-486cde6688c9', '{"sub": "b30ca799-a801-4efc-8cb8-486cde6688c9", "email": "testuser@fakemail.com", "username": "testuser", "email_verified": false, "phone_verified": false}', 'email', '2024-06-27 19:26:28.531462+00', '2024-06-27 19:26:28.531494+00', '2024-06-27 19:26:28.531494+00', '078b6146-36c9-4f67-93bf-43a55863ba7d');


INSERT INTO "public"."users" ("id", "username", "role", "email", "created_at", "updated_at") VALUES
	('53858ae2-ef53-401e-84cb-f3dfd32f1ef1', 'cryptobumper42', 'USER', 'cryptobumper42@mail.com', '2024-06-27 06:46:35.54645+00', '2024-06-27 06:46:35.54645+00'),
	('b30ca799-a801-4efc-8cb8-486cde6688c9', 'testuser', 'USER', NULL, '2024-06-27 19:26:28.529071+00', '2024-06-27 19:26:28.529071+00');



SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 98, true);


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

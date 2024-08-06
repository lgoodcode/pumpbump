CREATE TYPE user_role AS enum ('USER', 'ADMIN');
ALTER TYPE user_role OWNER TO postgres;

CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'USER',
    email text UNIQUE DEFAULT NULL,
    active boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.users OWNER TO postgres;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION is_authenticated() OWNER TO postgres;

/**
 * Using PERFORM improves performance; it's like SELECT 1 but without returning the value,
 */
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    PERFORM
        FROM public.users
        WHERE id = user_id AND role = 'ADMIN';
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY definer;

ALTER FUNCTION is_admin(uuid) OWNER TO postgres;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    PERFORM
        FROM public.users
        WHERE auth.uid() = id AND role = 'ADMIN';
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY definer;

ALTER FUNCTION is_admin() OWNER TO postgres;

CREATE POLICY "Can view own data and admins can view all users data" ON public.users
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = id OR (SELECT is_admin((SELECT auth.uid()))));

CREATE POLICY "Only admins can update users data" ON public.users
    FOR UPDATE
    TO authenticated
    USING (is_admin((SELECT auth.uid())));

-- Function that creates a user in our users table when a new user is created in auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, username, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NULLIF(LOWER(NEW.raw_user_meta_data->>'email'), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY definer;

ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Trigger that calls the function above
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users FOR EACH ROW
    EXECUTE PROCEDURE handle_new_user();


CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

ALTER FUNCTION update_users_updated_at() OWNER TO postgres;

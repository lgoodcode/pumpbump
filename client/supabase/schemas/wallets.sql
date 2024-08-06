-- No accounts or wallets will be deleted, only accounts deactivated

CREATE TABLE wallets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id),
    public_key text NOT NULL, -- Address in base58 format
    secret_key text NOT NULL -- Key in base58 format
);

ALTER TABLE public.wallets OWNER TO postgres;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_wallets_user_id ON wallets (user_id);

-- Only allows users to view their own wallet address.
-- Wallet creation is done by the server as the service role

CREATE POLICY "Can view wallet address" ON public.wallets
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION get_wallet_secret_key(user_id uuid)
RETURNS text AS $$
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
$$ LANGUAGE plpgsql;

ALTER FUNCTION get_wallet_secret_key(uuid) OWNER TO postgres;

-- No accounts or wallets will be deleted, only accounts deactivated
CREATE TABLE wallets (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    public_key text NOT NULL, -- Address in base58 format
    secret_key text NOT NULL -- Key in base58 format
);

ALTER TABLE public.wallets OWNER TO postgres;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Only allows users to view their own wallet address.
-- Wallet creation is done by the server as the service role

CREATE POLICY "Can view wallet address" ON public.wallets
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = id);

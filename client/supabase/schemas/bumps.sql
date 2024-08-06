CREATE TABLE bumps (
    id varchar(32) PRIMARY KEY, -- Ulid format - always 26 characters but given room
    user_id uuid REFERENCES public.users(id),
    total_runs integer NOT NULL,
    interval integer NOT NULL,
    action text NOT NULL,
    params jsonb NOT NULL,
    status text NOT NULL,
    completed_runs integer NOT NULL DEFAULT 0,
    failed_runs integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.bumps OWNER TO postgres;
ALTER TABLE public.bumps ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_bumps_user_id ON wallets (user_id);

CREATE POLICY "Can view bump history" ON public.bumps
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);


CREATE OR REPLACE FUNCTION update_bumps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bumps_updated_at
BEFORE UPDATE ON bumps
FOR EACH ROW
EXECUTE FUNCTION update_bumps_updated_at();

ALTER FUNCTION update_bumps_updated_at() OWNER TO postgres;


CREATE OR REPLACE FUNCTION finish_bump(task_id text, final_status text)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

ALTER FUNCTION finish_bump(text, text) OWNER TO postgres;

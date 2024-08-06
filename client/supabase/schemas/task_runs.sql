CREATE TABLE task_runs (
    id varchar(32) PRIMARY KEY, -- Ulid format - always 26 characters but given room
    task_id varchar(32), -- Is referenced in other tables but not linked here
    success boolean NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.task_runs OWNER TO postgres;
ALTER TABLE public.task_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_task_runs_task_id ON task_runs (task_id);

-- No RLS policy needed as this table is not user-specific
-- and is only used by the service role

CREATE OR REPLACE FUNCTION update_task_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_runs_updated_at
BEFORE UPDATE ON task_runs
FOR EACH ROW
EXECUTE FUNCTION update_task_runs_updated_at();

ALTER FUNCTION update_task_runs_updated_at() OWNER TO postgres;


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

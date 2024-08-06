# PumpBump Client

## Description

This is the frontend - NextJS, Supabase, and TailwindCSS client for the PumpBump project.

## Formatting

- `.prettierrc.json` is used to format the code.
- `.editorconfig` is used to set the editor settings.

## Error Logging

Only use Sentry `captureException()` on errors in the backend or from Supabase; anything that is not a response from our server, because it is already being done in the backend.

## Supabase

When creating tables or functions you need to set the owner to `postgres` so that when using the Supabase CLI it will work because it will default to `supabase_admin` but `postgres` is used in
the CLI.

```sql
ALTER TABLE users OWNER TO postgres;

ALTER FUNCTION do_something(string text, value integer) OWNER TO postgres;
```

### Supabase Backups

With using the Supabase migrations through the Supbase CLI, the database schema is fully backed up with changes over time. The data itself can be retrieved from the supabase dashboard and then used to restore the data.

### Database Config

By default, a Supabase project will limit queries to `1000` records. This can be changed in the
`Settings` tab of the project.

### RLS (Row Level Security)

Here is a typical RLS that is created:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can view own user data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Can update own user data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = users.role);
```

The `TO` clause specifies that only authenticated users can access the table.

```sql
TO authenticated
```

The `USING` clause specifies that only the user who owns the row can access it.

```sql
USING ((SELECT auth.uid() )= id);
```

The `WITH CHECK` clause specifies that the user can only update their own data and that
the role is not modified by checking it is the same as the current value.

```sql
WITH CHECK ((SELECT auth.uid()) = id AND role = users.role);
```

**NOTE:** The `auth.uid()` is wrapped in a subquery to improve performance: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

### Database Migrations

#### **!!! Important**

When making migrations, always ensure that if the current main migration is modified or deleted, that the following is added to the bottom:

```sql
--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

```

This is because the `db pull` doesn't retrieve this and is required for the auth triggers to work for creating new users.

#### Creating Migrations

This is the flow for creating database changes:

1. Ensure you have the newest migrations from the remote database:

```bash
supabase db pull
```

2. With the newest migrations, you can now create a new migration to experiment changes:

```bash
supabase migration new <table_name>
```

3. Enter all SQL changes in the new migration file and then apply them to the local database:

```bash
supabase migration up
```

4. Once you are satisfied with the changes, you can review the changes using a diff

```bash
supabase db diff --linked
```

**Note:** Running the diff against the local database won't work because the test migrations are applied to it (in the migrations folder).

5. If the changes look good, push the migrations to the remote database:

```bash
supabase db push
```

This is used because it will update the migration history.

6. [Optional] Once the changes are good, squash the migration files:

```bash
supabase migration squash --linked
```

This will combine the migration files into one file in the remote database, update the migration history, and update the local migrations file.

#### Resetting a Migration

If you push a migration up and it is not what you want, you can revert it:

1. List the migrations:

```bash
supabase migration list
```

2. Get the migration ID and revert it:

```bash
supabase migration repair <migration_id> --status reverted
```

3. Once the migration is reverted, you can delete it from the local migrations folder

#### Getting Seed Data

To get seed data from the remote database:

```bash
supabase db dump --data-only --local -f ./supabase/dump.sql
```

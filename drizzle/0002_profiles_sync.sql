-- Synchronisation profiles <-> auth.users (Supabase).
-- Ajoute la FK inter-schema, un trigger qui cree une ligne profiles a chaque
-- nouvelle auth.users, et backfille les utilisateurs deja inscrits.

-- 1) FK profiles.id -> auth.users(id) avec CASCADE.
ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint

-- 2) Fonction trigger. SECURITY DEFINER + search_path = '' pour executer
-- avec les droits du owner et eviter l'injection via search_path.
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO "public"."profiles" ("id", "email")
  VALUES (new.id, new.email)
  ON CONFLICT ("id") DO NOTHING;
  RETURN new;
END;
$$;--> statement-breakpoint

-- 3) Trigger apres chaque insert dans auth.users.
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";--> statement-breakpoint

CREATE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();--> statement-breakpoint

-- 4) Backfill : cree une ligne profiles pour chaque auth.users existant
-- (utile pour les comptes deja crees en dev avant cette migration).
INSERT INTO "public"."profiles" ("id", "email")
SELECT "id", "email" FROM "auth"."users"
ON CONFLICT ("id") DO NOTHING;

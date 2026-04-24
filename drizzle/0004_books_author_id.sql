ALTER TABLE "books" ADD COLUMN "author_id" uuid;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Backfill : associe les livres existants au profil dont le username
-- matche le snapshot texte `books.author`. Les livres sans match
-- (seed manuel, auteur supprime) gardent author_id NULL et retombent
-- sur le snapshot a l'affichage.
UPDATE "books"
SET "author_id" = p."id"
FROM "profiles" p
WHERE "books"."author_id" IS NULL
  AND "books"."author" = p."username";
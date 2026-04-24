# Intrigue

Romans interactifs modernes pour le marché francophone. Web app mobile-first, lecture courte, mécanique de choix qui modifient l'histoire.

Voir [`CLAUDE.md`](./CLAUDE.md) pour la vision produit et l'architecture.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript strict**
- **Tailwind CSS v4**
- **Supabase** (Postgres + Auth + Storage) via `@supabase/ssr` et le CLI local
- **Drizzle ORM** pour le schéma et les migrations
- **Zod** pour la validation
- **Vitest** pour les tests unitaires
- **Vercel** pour l'hébergement

Le code est en anglais (fichiers, routes, variables, commentaires). Seul ce qui s'affiche à l'utilisateur final reste en français.

## Prérequis

- **Node.js ≥ 20** (Next 16 officiellement requis)
- **Docker** (utilisé en sous-main par le CLI Supabase)
- Un compte **Vercel** (gratuit) — <https://vercel.com>
- `git` et `npm`

## Installation locale

Stack complète (Postgres + Auth + Studio + Inbucket SMTP-catcher) lancée localement via le CLI Supabase.

### 1. Cloner et installer

```bash
git clone <url-du-repo> intrigue
cd intrigue
npm install
```

### 2. Lancer le stack Supabase local

```bash
npx supabase start
```

Le premier démarrage tire les images Docker (~2 min). Une fois prêt, la commande affiche les URLs et les clés générées :

```
API URL:        http://127.0.0.1:54321
DB URL:         postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL:     http://127.0.0.1:54323
Inbucket URL:   http://127.0.0.1:54324
anon key:       eyJhbGc...
service_role:   eyJhbGc...
```

### 3. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` avec les clés affichées par `supabase start` :

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

> `.env.local` est git-ignoré. Ne jamais commiter de vraies clés.

### 4. Appliquer les migrations et seed

```bash
npm run db:migrate   # cree les tables (profiles, books, user_progress)
npm run db:seed      # insere "La Chambre secrete"
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir <http://127.0.0.1:3030>. Le site doit matcher le `site_url` de `supabase/config.toml` (sinon les magic links ne marchent pas).

### 6. Tester l'authentification (magic link)

1. Aller sur `/login`, saisir n'importe quelle adresse email
2. Ouvrir **Inbucket** <http://127.0.0.1:54324> pour lire le mail intercepté
3. Cliquer sur le lien → session active, redirection vers `/books`
4. Seuls les utilisateurs connectés peuvent accéder à la lecture

Pour arrêter : `npx supabase stop` (données gardées). `npx supabase stop --no-backup` efface tout.

## Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev (Turbopack par défaut en Next 16) |
| `npm run build` | Build production |
| `npm start` | Serveur production (après `build`) |
| `npm run typecheck` | Vérifie les types sans compiler |
| `npm run lint` | ESLint |
| `npm run format` | Formate avec Prettier |
| `npm run format:check` | Vérifie le formatage (CI) |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Tests en mode watch |
| `npm run db:generate` | Génère une migration Drizzle depuis `lib/db/schema.ts` |
| `npm run db:migrate` | Applique les migrations en attente à la base |
| `npm run db:seed` | Insère les livres de `content/` dans la base |
| `npm run db:studio` | UI web Drizzle pour inspecter la base |
| `npx supabase start` | Lance le stack local Supabase (DB + Auth + Studio + Inbucket) |
| `npx supabase stop` | Arrête le stack local |
| `npx supabase status` | Affiche les URLs et clés du stack local |

## Auth — comment ça marche

- **Magic link uniquement** : pas de mot de passe. `/login` envoie un lien par email, cliquer connecte.
- **Lecture = auth obligatoire + pseudo obligatoire**. `/books/[slug]/read` redirige vers `/login` si déconnecté ; si connecté mais sans pseudo, redirige vers `/account/choose-username`. Le catalogue `/books` et la fiche détail `/books/[slug]` restent publics.
- **Table `profiles`** synchronisée avec `auth.users` via trigger `on_auth_user_created` (migration `0002_profiles_sync.sql`). Chaque nouveau compte a automatiquement une ligne `profiles` avec `username` nul — à choisir au premier login.
- **Format pseudo** : 3-32 caractères, `[a-z0-9_-]` (tout minuscule). Unique. Modifiable depuis `/account`. Le formulaire vérifie la disponibilité en direct (server action `checkUsernameAvailable`, debounce 350 ms) ; pas d'erreur si tu ressaisies ton propre pseudo actuel.
- **Progression** (`user_progress.user_id`) est indexée sur l'`auth.users.id` Supabase. Un utilisateur retrouve ses parties, ses variables et ses fins à chaque connexion.

## Admin — créer / modifier des livres

- Mets ton email dans `ADMIN_EMAILS` (`.env.local`), format CSV, puis redémarre `npm run dev`.
- `/dashboard` (« Mes créations ») liste tous les livres (publiés + brouillons) avec une miniature de couverture, l'auteur, et un lien vers `/books/[slug]/edit`.
- `/books/create` : formulaire métadonnées + textarea JSON pour le `content`.
  - Le champ **Slug** interroge automatiquement la base (server action `checkSlugAvailable`) pour signaler les collisions immédiatement.
  - Le champ **Genre** est un select fermé (Mystère, Thriller, Romance, Science-fiction, Fantasy, Horreur, Aventure, Historique).
  - Le champ **Couverture** accepte une URL ou un fichier PNG/JPEG/WebP (max 5 Mo). Le fichier est uploadé sur le bucket public Supabase `book-covers` via la server action `uploadBookCover`, et l'URL publique retournée remplit automatiquement le champ.
  - Le bouton **Importer un fichier .json** pré-remplit automatiquement les champs à partir d'un export (`Book` complet → tout est rempli, `BookContent` seul → seul le content est rempli).
- Validation côté serveur : `lib/reader/validation.ts` (intégrité du graphe) + `lib/db/books-form.ts` (métadonnées). Les erreurs sont affichées en bloc sous le formulaire.
- Un livre sans `publishedAt` reste brouillon, invisible du catalogue public mais accessible depuis `/dashboard`.
- Les routes admin (`/dashboard`, `/books/create`, `/books/[slug]/edit`) seront plus tard ouvertes à tous les utilisateurs connectés — c'est pour ça qu'elles ne sont pas sous `/admin/*`. Il suffira de remplacer `requireAdmin` par `requireProfile` dans ces pages.
- En dev, tous les mails partent dans **Inbucket** (<http://127.0.0.1:54324>) — pas de vraie boîte à configurer.
- En prod, configurer un SMTP dans Supabase (dashboard → Auth → SMTP Settings).
- En prod, **créer le bucket de stockage** `book-covers` dans le dashboard Supabase (Storage → New bucket) : `public` coché, file size limit 5 MB, MIME types autorisés `image/png, image/jpeg, image/webp`. En local le bucket est déclaré dans `supabase/config.toml` et créé au démarrage du stack.

## Catalogue public

`/books` affiche les livres publiés dans une mise en page à deux colonnes (desktop) : **sidebar de filtres à gauche**, **liste des livres à droite**. Sur mobile, la sidebar passe au-dessus de la liste. Filtres côté client (`app/(marketing)/books/_components/catalog-browser.tsx`) :

- recherche par titre,
- sélecteur de genre, d'auteur, de tag,
- filtre de durée (court ≤ 30 min, moyen 30-90 min, long > 90 min),
- bouton « Réinitialiser les filtres » quand au moins un est actif.

La landing affiche les **5 dernières sorties** (plus récent en haut).

## Déploiement sur Vercel

1. **Pousser le repo** sur GitHub / GitLab.
2. Sur <https://vercel.com/new>, importer le repo. Vercel détecte Next.js automatiquement.
3. **Ajouter les variables d'environnement** avec les valeurs d'un **projet Supabase cloud** (pas le local) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (transaction pooler, port 6543)
   - `NEXT_PUBLIC_SITE_URL` (l'URL publique de l'app, ex `https://intrigue.app`) — utilisée comme origine pour l'`emailRedirectTo` des magic links
4. **Déployer**. Le premier build doit passer en ~2 minutes.
5. Dans le dashboard Supabase cloud, ajouter l'URL publique Vercel dans **Auth → URL Configuration → Site URL et Redirect URLs**.

### Migrations en prod

Vercel ne lance pas automatiquement `db:migrate`. Deux options :

- **Manuel** (recommandé au MVP) : lancer `npm run db:migrate` en local avec la `DATABASE_URL` de prod après avoir vérifié la migration.
- **Automatique** : ajouter `npm run db:migrate && next build` dans le build command Vercel. Attention aux migrations destructives.

## Conventions

Voir [`CLAUDE.md`](./CLAUDE.md) pour les conventions de code, la vision produit et ce qui est hors scope au MVP.

## UI — layouts et mode lecture

- **Header global** (logo, Catalogue, Dashboard admin si applicable, Mon compte / Connexion) est rendu sur toutes les pages — publiques comme authentifiees — **sauf le reader**.
- **Reader immersif** (`/books/[slug]/read`) : pas de header global, pas de footer. Juste une barre fine en haut avec un bouton **Retour** (vers la fiche du livre), le titre, et un compteur de fins découvertes. L'objectif est une page unique-focus pour la lecture.
- **Organisation App Router** : les pages authentifiees qui ont besoin du header sont placées sous `app/(app)/(chrome)/…` ; le reader reste hors de ce sous-groupe pour ne pas en hériter. Voir [`CLAUDE.md`](./CLAUDE.md#ui--structure-des-layouts).

## Structure principale

```
app/
  (marketing)/              Publique : landing, catalogue, page détail livre, légales, login
    layout.tsx              SiteHeader + SiteFooter
    books/                  Catalogue + détail ([slug]) — publics
      _components/          CatalogBrowser (filtres client)
    login/                  Magic link form + check-email
    legal/, terms/, privacy/
  (app)/                    Partie authentifiee
    (chrome)/               Sous-groupe : SiteHeader + SiteFooter partagés
      layout.tsx
      account/              Profil minimal + choose-username
      dashboard/            Liste admin de tous les livres
      books/create/         Formulaire nouveau livre (admin)
      books/[slug]/edit/    Formulaire d'édition (admin)
    books/
      _actions/             Server actions (progress, admin, checkSlugAvailable)
      [slug]/read/          Reader immersif (hors chrome)
  api/auth/                 Route handlers (confirm magic link, signout)
components/
  ui/                       SiteHeader, SiteFooter, primitives
  reader/                   BookReader (client)
  admin/                    BookForm (client, partagé create / edit)
lib/
  db/                       Client Drizzle + schéma + seed + helpers + books-form.ts
  supabase/                 Clients server/client, proxy session, auth/profile/admin helpers
  reader/                   Types + runtime pur (testé) + validation Zod (testée)
  utils/                    sanitizeNext, validateUsername, …
content/                    Livres TypeScript (versionnés git, insérés via db:seed)
drizzle/                    Migrations SQL générées
supabase/                   Config CLI local (config.toml)
proxy.ts                    Proxy Next 16 — refresh session Supabase
```

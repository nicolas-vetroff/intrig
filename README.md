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
npm run db:migrate   # cree les tables (profiles, waitlist, books, user_progress)
npm run db:seed      # insere "La Chambre secrete"
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir <http://127.0.0.1:3000>. Le site doit matcher le `site_url` de `supabase/config.toml` (sinon les magic links ne marchent pas).

### 6. Tester l'authentification (magic link)

1. Aller sur `/connexion`, saisir n'importe quelle adresse email
2. Ouvrir **Inbucket** <http://127.0.0.1:54324> pour lire le mail intercepté
3. Cliquer sur le lien → session active, redirection vers `/livres`
4. Seuls les utilisateurs connectés peuvent accéder au catalogue et à la lecture

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

- **Magic link uniquement** : pas de mot de passe. `/connexion` envoie un lien par email, cliquer connecte.
- **Lecture = auth obligatoire**. `/livres` et `/livres/[slug]` redirigent vers `/connexion?next=...` si pas connecté.
- **Progression** (`user_progress.user_id`) est indexée sur l'`auth.users.id` Supabase. Un utilisateur retrouve ses parties, ses variables et ses fins à chaque connexion.
- En dev, tous les mails partent dans **Inbucket** (<http://127.0.0.1:54324>) — pas de vraie boîte à configurer.
- En prod, configurer un SMTP dans Supabase (dashboard → Auth → SMTP Settings).

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

## Structure principale

```
app/
  (marketing)/        Landing, connexion, pages légales
    connexion/        Formulaire magic link + "vérifier email"
  (app)/              Auth gated (requireUser dans chaque page)
    livres/           Catalogue + lecture ([slug])
    compte/           Profil minimal + logout
  api/auth/           Route handlers (confirm magic link, signout)
lib/
  db/                 Client Drizzle + schéma + seed
  supabase/           Clients server/client, proxy de session, auth helpers
  reader/             Types + runtime pur (testé)
  stripe/             Helpers Stripe (à venir)
  utils/              Helpers divers (sanitizeNext, …)
components/
  ui/                 Primitives réutilisables
  reader/             BookReader (client component)
content/              Livres TypeScript (versionnés git, insérés via db:seed)
drizzle/              Migrations SQL générées
supabase/             Config CLI local (config.toml)
proxy.ts              Proxy Next 16 — refresh session Supabase
```

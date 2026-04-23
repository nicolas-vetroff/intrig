# Intrigue

Romans interactifs modernes pour le marché francophone. Web app mobile-first, lecture courte, mécanique de choix qui modifient l'histoire.

Voir [`CLAUDE.md`](./CLAUDE.md) pour la vision produit et l'architecture.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript strict**
- **Tailwind CSS v4**
- **Supabase** (Postgres + Auth) via `@supabase/ssr`
- **Drizzle ORM** pour le schéma et les migrations
- **Zod** pour la validation
- **Vercel** pour l'hébergement

## Prérequis

- **Node.js ≥ 20** (Next 16 officiellement requis)
- Un compte **Supabase** (gratuit) — <https://supabase.com>
- Un compte **Vercel** (gratuit) — <https://vercel.com>
- `git` et `npm`

## Installation locale

Deux chemins possibles selon ce que tu veux exercer :

- **[Docker](#dev-avec-docker-postgres-local)** — tout en local (Postgres + app), pour itérer sur le moteur de lecture et les requêtes DB sans dépendre de Supabase.
- **[Sans Docker](#dev-sans-docker-avec-supabase)** — connexion directe à un projet Supabase (nécessaire pour l'auth et les uploads plus tard).

### Dev avec Docker (Postgres local)

Prérequis : Docker + Docker Compose.

```bash
# 1) Lancer la stack (Postgres + app)
docker compose up --build

# 2) Dans un autre terminal, appliquer les migrations une fois
docker compose exec app npm run db:migrate

# 3) Insérer le livre de test "La Chambre secrète"
docker compose exec app npm run db:seed
```

L'app est alors servie sur <http://localhost:3000>. Pages utiles :

- `/` — landing + waitlist
- `/livres` — catalogue (liste les livres de la DB)
- `/livres/la-chambre-secrete` — lecture du livre de test

Au premier choix, un cookie anonyme `reader-session-id` est créé ; ta progression survit aux reloads et à la navigation.

Pour arrêter : `docker compose down` (les données Postgres restent dans le volume `db-data`). `docker compose down -v` efface tout.

### Dev sans Docker (avec Supabase)

#### 1. Cloner et installer

```bash
git clone <url-du-repo> intrigue
cd intrigue
npm install
```

#### 2. Créer le projet Supabase

1. Créer un projet sur <https://supabase.com/dashboard/projects>.
2. Dans **Settings → API**, récupérer :
   - l'**URL du projet** → `NEXT_PUBLIC_SUPABASE_URL`
   - la **clé anon / public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - la **clé service role** → `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement)
3. Dans **Settings → Database → Connection string**, copier l'URL du **transaction pooler** (port 6543) → `DATABASE_URL`. Remplacer `[YOUR-PASSWORD]` par le mot de passe de la base.

#### 3. Variables d'environnement

Copier le gabarit puis remplir :

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

> `.env.local` est git-ignoré. Ne jamais commiter de vraies clés.

#### 4. Appliquer la migration initiale à la base

La migration SQL est déjà générée dans `drizzle/0000_initial.sql`. Pour l'appliquer :

```bash
npm run db:migrate
```

Cela crée les tables `profiles`, `waitlist`, `books` et `user_progress`.

> **À faire manuellement** (hors Drizzle, non inclus dans la migration) :
> les clés étrangères `profiles.id → auth.users(id)` et
> `user_progress.user_id → auth.users(id)` doivent être ajoutées via
> une migration SQL directe dans le dashboard Supabase, avec un
> trigger `on_auth_user_created` qui crée automatiquement une ligne
> `profiles` à l'inscription. À coder dans une session dédiée auth.

#### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir <http://localhost:3000>.

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

## Déploiement sur Vercel

1. **Pousser le repo** sur GitHub / GitLab.
2. Sur <https://vercel.com/new>, importer le repo. Vercel détecte Next.js automatiquement.
3. **Ajouter les variables d'environnement** (Settings → Environment Variables) — les quatre mêmes que `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
4. **Déployer**. Le premier build doit passer en ~2 minutes.
5. Pour les déploiements suivants, chaque push sur `main` déclenche un build. Les pull requests génèrent des preview deployments.

### Migrations en prod

Vercel ne lance pas automatiquement `db:migrate`. Deux options :

- **Manuel** (recommandé au MVP) : lancer `npm run db:migrate` en local avec la `DATABASE_URL` de prod après avoir vérifié la migration.
- **Automatique** : ajouter `npm run db:migrate && next build` dans le build command Vercel. Attention aux migrations destructives.

## Conventions

Voir [`CLAUDE.md`](./CLAUDE.md) pour les conventions de code, la vision produit et ce qui est hors scope au MVP.

## Structure principale

```
app/
  (marketing)/        Landing, mentions légales, CGU, confidentialité
  (app)/livres/       Catalogue (placeholder)
  (app)/compte/       Profil utilisateur (à venir)
  api/                Route handlers (webhooks Stripe, cron)
  admin/              Interface de publication (à venir)
lib/
  db/                 Client Drizzle + schéma
  supabase/           Clients server/client + session proxy
  reader/             Moteur de lecture (à venir)
  stripe/             Helpers Stripe (à venir)
  utils/              Helpers divers
components/
  ui/                 Primitives réutilisables
  reader/             Composants du moteur de lecture
content/              Livres en JSON (versionnés git)
drizzle/              Migrations SQL générées
proxy.ts              Proxy Next 16 (ex-middleware) — refresh session Supabase
```

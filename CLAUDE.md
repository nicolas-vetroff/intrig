# Intrigue — Contexte projet pour Claude Code

> Ce fichier est ma mémoire projet. Relis-le au début de chaque session. Si tu fais un changement de direction important, propose de le mettre à jour.

## Vision produit

App web mobile-first de lecture de **livres interactifs** (romans dont vous êtes le héros modernes) pour le marché **francophone**. Alternative moderne à Adrenalivre (startup française fermée en 2019, communauté orpheline).

Format : lecture courte (1-3h par livre), genres variés (thriller, romance, mystère, SF), UX premium comparable à une app Kindle/Readwise mais avec mécanique de choix qui modifient l'histoire.

Modèle économique : freemium. Gratuit avec pub + 1-2 livres complets gratuits. Abonnement illimité 7-8€/mois (tout le catalogue, pas de pub, choix exclusifs, mode offline). Achat unitaire 3-5€ par livre en option.

## Stade actuel

**MVP** développé par un dev solo full-stack, ~10h/semaine. Objectif : app fonctionnelle avec lecture + auth + paiement en **6-8 week-ends**. Le catalogue est géré via une interface admin simple (seulement moi qui publie au MVP). Pas d'outil auteur grand public au MVP.

## Stack technique

- **Framework** : Next.js 16 (App Router) + TypeScript strict + React 19
- **Styling** : Tailwind CSS v4
- **DB + Auth + Storage** : Supabase (Postgres managé)
- **ORM** : Drizzle
- **Paiement** : Stripe (Subscriptions + Checkout)
- **Hébergement** : Vercel
- **Analytics** : Plausible (conforme RGPD)
- **Erreurs** : Sentry
- **Validation** : Zod

## Principes d'architecture

- **Mobile-first** responsive. Progressive Web App (manifest + service worker) avant toute app native.
- **App Router** avec **React Server Components** quand c'est pertinent.
- **Server Actions** pour les mutations (pas de REST inutile).
- **Pas de state manager externe** — React state + données serveur suffisent au MVP.
- **TypeScript strict**. Aucun `any` non justifié par commentaire.
- **Accessibilité sérieuse** dès le départ : ARIA, contrastes WCAG AA minimum, focus visible, navigation clavier.
- **i18n-ready** dans la structure mais 100% français au MVP.
- **Simplicité > cleverness**. Ne pas sur-architecturer. Pas de monorepo, pas de microservices, pas de GraphQL.
- **Code en anglais, UI en français**. Noms de fichiers, routes, variables, commentaires, messages d'erreur internes (logs) sont en anglais. Seul ce qui est rendu à l'écran pour le lecteur reste en français.

## Spécificités Next.js 16 à garder en tête

- **`proxy.ts` remplace `middleware.ts`** à la racine (fonction exportée `proxy`, runtime `nodejs`). Pas de `middleware.ts` dans ce projet.
- **APIs async** : `cookies()`, `headers()`, `params`, `searchParams` sont toutes `Promise` et requièrent `await`.
- **Turbopack** est activé par défaut en dev et en build. Pas besoin de flag.
- **Server Actions** : pattern `useActionState((prevState, formData) => ...)` côté client.
- Avant d'utiliser une API Next qui a l'air de bouger, vérifier dans `node_modules/next/dist/docs/` (doc embarquée fait foi).

## Authentification

- **Magic link Supabase uniquement** (pas de mot de passe, pas de provider social au MVP).
- **Catalogue (`/books`) et page détail (`/books/[slug]`) publiques** : n'importe qui peut découvrir les livres. La lecture effective (`/books/[slug]/read`) exige auth + pseudo ; si absent, redirect vers `/login` puis `/account/choose-username`.
- **Table `profiles`** est synchronisée avec `auth.users` via FK + trigger `on_auth_user_created` (migration `0002_profiles_sync.sql`). Colonnes : `id`, `email`, `username` (nullable au signup, à choisir au 1er login), `created_at`.
- `user_progress.user_id` reste directement l'`auth.users.id` Supabase (pas de passage par `profiles`). La table `profiles` sert uniquement aux champs custom (pseudo, plus tard avatar).
- Dev local : stack complet via `npx supabase start` (Postgres + Auth + Studio + Inbucket pour intercepter les mails). Le `.env.local` pointe sur les ports `54321` (API) et `54322` (DB).
- Helpers auth (`lib/supabase/auth.ts`) : `getCurrentUser()` lit, `requireUser(next)` redirect vers `/login`.
- Helpers profil (`lib/supabase/profile.ts`) : `getCurrentProfile()` lit, `requireProfile(next)` compose `requireUser` + redirect vers `/account/choose-username` si `username` nul.
- Callback magic link : `/api/auth/confirm?code=...&next=...` (PKCE par défaut) ou `?token_hash=...&type=...` (legacy OTP). Le `next` passe par `sanitizeNext` pour empêcher les open redirects.
- **Format pseudo** : 3-32 caractères, `[a-z0-9_-]` (tout minuscule après normalisation). Unique. Validation pure dans `lib/utils/username.ts` (testée).

## Admin et gestion du catalogue

- **Gating admin** : env var `ADMIN_EMAILS` (liste d'emails séparés par virgule). Helpers `isAdminEmail(email)` et `requireAdmin(next)` dans `lib/supabase/admin.ts`. Pas de colonne DB : quand la création sera ouverte aux lecteurs, on retirera juste `requireAdmin` des pages concernées — sans migration.
- **Arborescence `/books/*`** :
  - `/books` (publique, `(marketing)`) : catalogue des livres publiés, avec filtres (titre, genre, auteur, tag, durée)
  - `/books/[slug]` (publique, `(marketing)`) : page détail / pitch avec CTA "Lire"
  - `/books/[slug]/read` (auth + pseudo requis, `(app)`) : le reader
  - `/books/create` (admin, `(app)`) : formulaire nouveau livre
  - `/books/[slug]/edit` (admin, `(app)`) : formulaire d'édition
  - `/dashboard` (admin, `(app)`) : liste tous les livres (drafts + publiés), titrée « Mes créations »
- **Drafts vs publiés** : un livre avec `published_at = null` est un brouillon, invisible du catalogue public mais visible depuis le dashboard. Le toggle se fait via la checkbox "Publier" du formulaire (sans hint supplémentaire).
- **Form upload** : `components/admin/BookForm.tsx` (client). Métadonnées en champs + textarea JSON pour le `content` (BookContent). Le champ `Slug` interroge le serveur (server action `checkSlugAvailable`) avec un debounce de 350 ms pour signaler immédiatement une collision. Le champ `Genre` est un `select` fermé (liste `GENRE_OPTIONS`). Import de fichier `.json` qui pré-remplit soit tous les champs (fichier = `Book` complet), soit juste le content (fichier = `BookContent` seul).
- **Validation server-side** : `lib/db/books-form.ts` (Zod + `parseBookForm`) valide les métadonnées et `lib/reader/validation.ts` valide le `content` structurellement (références internes cohérentes).
- **Slugs réservés** : `create`, `edit`, `read` interdits pour éviter les collisions d'URL.

## UI / structure des layouts

- **Header global** (`components/ui/SiteHeader.tsx`) + **footer** (`components/ui/SiteFooter.tsx`) sont rendus sur toutes les pages sauf le reader. Le header est un Server Component (lit la session sans flash), sticky en haut, avec logo, Catalogue, Dashboard (admin), et Mon compte / Connexion selon l'état auth.
- **Mode lecture immersif** : `/books/[slug]/read` est volontairement hors des layouts chrome (pas de header global, pas de footer). Une barre fine en haut expose un bouton « Retour » (vers la fiche du livre), le titre, et un compteur `fins découvertes / total`.
- **Route groups pour isoler le reader** :
  - `app/(marketing)/layout.tsx` → header + footer (pages publiques).
  - `app/(app)/(chrome)/layout.tsx` → header + footer (pages authentifiees classiques : account, dashboard, create, edit).
  - `app/(app)/books/[slug]/read/page.tsx` → hors du sous-groupe `(chrome)`, hérite uniquement du root layout. C'est le seul moyen propre en App Router de ne pas hériter du chrome.
- **Landing** : hero + CTA catalogue + aperçu des 3 derniers livres publiés sous le libellé « Dernières sorties ».
- **Catalogue** : filtres client (titre, genre, auteur, tag, durée) implémentés dans `app/(marketing)/books/_components/catalog-browser.tsx`.
- **Pas de waitlist** : retirée au passage en v1 (migration `0003_drop_waitlist.sql`).

## Structure de dossiers

```
/app
  /(marketing)              # Publique : landing, catalogue, page détail livre, légales, login
    /books                  # Catalogue + détail (publics)
      /_components          # CatalogBrowser (filtres client)
      /[slug]
    /login                  # Magic link form + check-email
    /legal, /terms, /privacy
  /(app)                    # Partie authentifiée
    /(chrome)               # Sous-groupe : header + footer partagés
      /account              # Profil + choose-username
      /dashboard            # Liste admin de tous les livres (« Mes créations »)
      /books/create         # Formulaire nouveau livre (admin)
      /books/[slug]/edit    # Formulaire d'édition (admin)
    /books
      /_actions             # Server actions (progress, admin, checkSlugAvailable)
      /[slug]/read          # Reader immersif (hors chrome)
  /api/auth                 # confirm magic link, signout
/components
  /ui                       # SiteHeader, SiteFooter, primitives
  /reader                   # BookReader (client)
  /admin                    # BookForm (partagé create/edit)
/lib
  /db                       # Client Drizzle, schémas, requêtes typées, books-form
  /reader                   # Types, runtime pur testé, validation Zod testée
  /stripe                   # Helpers Stripe (à venir)
  /supabase                 # Clients + auth/profile/admin helpers
  /utils                    # sanitizeNext, validateUsername
/content                    # Livres TypeScript (versionnés git)
/drizzle                    # Migrations SQL générées
proxy.ts                    # Proxy Next 16 (ex-middleware)
```

## Modèle de données — Livre interactif

Un livre est un **graphe dirigé avec état partagé**. Je charge le livre complet en JSON côté client et le moteur navigue localement. Le serveur stocke uniquement la progression utilisateur.

```typescript
// lib/reader/types.ts

// Les champs nullable permettent un brouillon avant publication
// (pas de cover / synopsis / publishedAt tant que le livre n'est pas pret).
export type Book = {
  id: string
  slug: string
  title: string
  author: string
  coverImage: string | null
  synopsis: string | null
  genre: string | null
  tags: string[] | null
  estimatedMinutes: number | null
  tier: 'free' | 'premium'
  publishedAt: Date | null
  content: BookContent
}

export type BookContent = {
  startNodeId: string
  variablesSchema: VariableDef[]
  nodes: Record<string, Node>
  endings: Record<string, Ending>
}

export type VariableDef = {
  name: string
  type: 'number' | 'boolean' | 'string'
  initial: number | boolean | string
}

export type Node =
  | { id: string; type: 'scene'; text: string; illustration?: string; next: string }
  | { id: string; type: 'choice'; text: string; illustration?: string; choices: Choice[] }
  | { id: string; type: 'ending'; endingId: string }

export type Choice = {
  id: string
  label: string
  nextNode: string
  conditions?: Condition[]
  effects?: Effect[]
  isPremium?: boolean
}

export type Condition = {
  variable: string
  op: '==' | '!=' | '>' | '<' | '>=' | '<='
  value: number | boolean | string
}

export type Effect = {
  variable: string
  op: 'set' | 'add' | 'sub'
  value: number | boolean | string
}

export type Ending = {
  id: string
  type: 'good' | 'bad' | 'neutral' | 'secret'
  title: string
  text: string
  illustration?: string
}
```

Progression utilisateur :

```typescript
export type UserProgress = {
  userId: string
  bookId: string
  currentNodeId: string
  variables: Record<string, number | boolean | string>
  history: string[]         // IDs des nodes visités, dans l'ordre
  reachedEndings: string[]  // pour afficher "3/7 fins trouvées"
  updatedAt: Date
}
```

## Conventions de code

- **Nommage** : `camelCase` pour variables/fonctions, `PascalCase` pour types/composants, `kebab-case` pour fichiers, `SCREAMING_SNAKE` pour constantes
- **Fichiers** : 1 composant React non-primitif par fichier
- **Async** : `async/await` toujours, jamais `.then()` en code applicatif
- **Erreurs** : jamais de `try/catch` vide. Soit on gère, soit on laisse remonter.
- **Commentaires** : pour le **pourquoi**, pas le **quoi**. Pas de commentaires qui paraphrasent le code. **Toujours en anglais.**
- **Langue** : tout le code (fichiers, routes, variables, commentaires, logs) en **anglais**. Seuls les libellés rendus à l'utilisateur final restent en français.
- **CSS** : Tailwind only. Pas de CSS inline sauf nécessité visuelle dynamique (ex: variable CSS calculée).
- **Tests** : unitaires obligatoires sur le moteur de lecture (critique). Le reste : au cas par cas.
- **Imports** : alias `@/*` pour tout ce qui est dans le projet. Ordre : externes, puis internes, puis relatifs.

## Ce qu'il NE FAUT PAS faire au MVP

Explicitement hors scope :

- App native iOS/Android (web + PWA suffit)
- Éditeur de livres côté utilisateur (publication admin manuelle seulement)
- Notifications push
- Features sociales (commentaires, partages, amis)
- Multi-langue (FR uniquement)
- Système de recommandation complexe (liste + filtre simple suffit)
- A/B testing framework
- Dark mode (ajouté plus tard si demandé)
- CI/CD sophistiqué (lint + build sur PR suffit)
- Microservices, queue system, cache Redis

## Conformité France / légal

À prévoir avant la mise en paiement :

- **Mentions légales** (obligatoire loi LCEN)
- **CGU / CGV** distinctes
- **Politique de confidentialité** (RGPD)
- **Bandeau cookies** conforme CNIL (Plausible ne pose pas de cookie donc le bandeau peut rester simple)
- **TVA OSS** gérée via Stripe Tax
- Pas de contenu pour moins de 13 ans au MVP (évite les contraintes RGPD-K / COPPA)

## Interaction Claude Code ↔ moi

- **Avant une décision d'archi importante**, propose-moi les options et demande confirmation.
- **Commits granulaires** : un commit par étape logique, pas un mega-commit.
- **Messages de commit** en français, impératif : "ajoute X", "corrige Y".
- **PR descriptions** (si je demande) en français, liste des changements + tests effectués.
- **TODO** : tout laissé de côté exprès doit être marqué `// TODO:` avec une note claire.
- Si un truc te semble bizarre dans ce fichier ou dans mes demandes, **remets-le en cause**, ne fais pas aveuglément.

# Intrigue — Contexte projet pour Claude Code

> Ce fichier est ma mémoire projet. Relis-le au début de chaque session. Si tu fais un changement de direction important, propose de le mettre à jour.

## Vision produit

App web mobile-first de lecture de **livres interactifs** (romans dont vous êtes le héros modernes) pour le marché **francophone**. Alternative moderne à Adrenalivre (startup française fermée en 2019, communauté orpheline). 

Format : lecture courte (1-3h par livre), genres variés (thriller, romance, mystère, SF), UX premium comparable à une app Kindle/Readwise mais avec mécanique de choix qui modifient l'histoire.

Modèle économique : freemium. Gratuit avec pub + 1-2 livres complets gratuits. Abonnement illimité 7-8€/mois (tout le catalogue, pas de pub, choix exclusifs, mode offline). Achat unitaire 3-5€ par livre en option.

## Stade actuel

**MVP** développé par un dev solo full-stack, ~10h/semaine. Objectif : app fonctionnelle avec lecture + auth + paiement en **6-8 week-ends**. Le catalogue est géré via une interface admin simple (seulement moi qui publie au MVP). Pas d'outil auteur grand public au MVP.

## Stack technique

- **Framework** : Next.js 15 (App Router) + TypeScript strict
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

## Structure de dossiers

/app
/(marketing)          # Landing, pricing, mentions légales, CGU/CGV
/(app)                # Partie authentifiée
/livres               # Catalogue + lecture
/compte               # Profil, abonnement, sauvegardes
/api                  # API routes (webhooks Stripe, cron jobs)
/admin                # Admin (whitelist email, publication de livres)
/components
/ui                   # Primitives réutilisables (Button, Card, Input, etc.)
/reader               # Composants du moteur de lecture
/lib
/db                   # Client Drizzle, schémas, requêtes typées
/reader               # BookRuntime, types Book/Node/Choice, helpers
/stripe               # Helpers Stripe, webhooks handlers
/supabase             # Clients server/client/middleware
/utils                # Helpers divers (formatage, validation)
/content                # Livres en JSON (versionnés git au MVP)
/public                 # Assets statiques
/drizzle                # Migrations générées
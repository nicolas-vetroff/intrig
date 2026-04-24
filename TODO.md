**Bloquants avant d'ouvrir à des vrais gens**

*Du contenu, plus d'un livre.*
> Aujourd'hui tu as La Chambre secrète (3 min de lecture) et c'est tout. Tu ne peux rien conclure d'un test mono-livre — ni sur l'envie de revenir, ni sur la qualité du format, parce que le seul signal que tu captures c'est "ai-je aimé ce livre-là". Il te faut minimum 3-4 livres de genres/durées variées pour que la question "tu reviens ?" ait un sens. Gros goulot d'étranglement, parce que ça dépend de ta capacité d'auteur.

*Déploiement prod + SMTP.*
> En local Inbucket intercepte tes mails, mais en prod Supabase n'envoie rien si tu ne branches pas un vrai SMTP (Resend ~5€/mois). Sans ça, aucun magic link ne part et personne ne peut se connecter.

*Pages légales non-vides.*
> /legal, /terms, /privacy sont des placeholders "page en cours de rédaction". La LCEN et la RGPD l'interdisent dès que le site est public, même en beta. Tu peux faire minimaliste mais pas vide — une demi-journée de rédaction max.

*Observabilité : Plausible + Sentry.*
> 5 min à brancher chacun. Sans Plausible, tu ne sais pas combien de testeurs commencent un livre vs le terminent, quelles fins ils trouvent, à quelle étape ils abandonnent — le feedback qualitatif seul te ment parce que les gens ne te disent pas qu'ils ont oublié de revenir. Sans Sentry, tu ne verras pas les crashes en prod.

*Un canal de feedback.*
> Un lien Tally/Google Form accessible depuis chaque livre (fin + abandon) avec 3-5 questions. Sans ça tu n'auras que des métriques — utiles mais qui ne répondent pas au "pourquoi".

---

**Sérieux mais pas vraiment bloquant**

*Google OAuth*
> Comme je disais précédemment, cela réduit la friction à la reconnexion (important si tu testes la rétention sur plusieurs sessions).

*Un "À propos"*
> Il faut qu'il soit honnête (qui tu es, ce que tu cherches à valider). Les early testers sont plus bavards quand ils savent qu'on teste vraiment.

*Un mail de contact*
> Un mail doit être visible quelque part.

---

**Peut attendre sans invalider le test**

*Stripe / paiement.*
> Tu testes "est-ce qu'ils aiment ?" avant "sont-ils prêts à payer ?". Pour la 2e question, un faux paywall ("🔒 Bientôt premium — laisse ton email") te donne un meilleur signal de willingness-to-pay qu'un vrai flux à 7€/mois sur un échantillon de 20 personnes.

*PWA / offline, cookie banner, admin ouvert aux auteurs tiers.*
> Tous hors scope MVP, gardent leur place dans la roadmap.

Session 9 :
- Revoir le système de tags

---
AVANT D'ALLER PLUS LOIN : régler bugs, améliorer style existant, Faire tester (étude de marché)
---

- Le "Publier" sera un bouton et non une checkbox. Une fois publié, il est impossible de modifier le livre ou de le supprimer
- Tous les champs sont obligatoires pour pouvoir publier le livre
- La publication d'un ouvrage empêche sa modification. Aussi, une fois un ouvrage marqué comme publié, doit être passé en revu par un admin.
- Popup "Votre ouvrage sera passé en revue avant d'être publié. Attention, une fois publié, vous ne pourrez plus le modifier" -> 2 choix : Accepter/Refuser

- Trouver un moyen pour créer les noeuds de l'histoire directement sur le site et non plus avec du JSON directement. Cependant, l'import doit pouvoir créer les noeuds (au lieu de s'écrire dans un textarea)
- Ajouter des triggers (pages spéciales) qui s'activent si une variable remplie une condition (activable à tout moment)

- Paiement Stripe — abonnement, gating premium, portail client
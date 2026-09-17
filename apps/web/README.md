# Site public et landing Mentis

Next.js exporte le site statiquement dans `out/`. La configuration Vercel et les pages légales restent communes au site. Pour lancer le site depuis la racine :

```sh
bun run --filter @mentis/web dev
bun run --filter @mentis/web build
bun run check
```

## Liste d’attente

La page `/mentis` intègre le formulaire public [Tally xXGJZy](https://tally.so/r/xXGJZy). Son identifiant est dans `src/features/mentis/waitlist-config.ts`. Aucune clé API, base de données ou route serveur n’est nécessaire.

Le formulaire est chargé à l’approche de la section bêta. Tally gère les champs obligatoires, la validation de l’e-mail, le consentement, le CAPTCHA et l’enregistrement. Le script officiel adapte la hauteur de l’iframe. Le composant ne confirme la candidature qu’après un événement `Tally.FormSubmitted` provenant de l’iframe attendue, de `https://tally.so`, et du bon formulaire. Une panne de chargement affiche un bouton de reprise et un lien direct. Les réponses ne sont jamais copiées dans le site ni ses journaux.

Hugo administre Tally lui-même. Conserver les champs prénom, nom, système iOS/Android, adresse du compte du store et consentement obligatoire. Garder les instructions concernant le compte Google/Apple et l’absence de mot de passe demandé. Une modification du formulaire dans Tally est publiée indépendamment de Git : vérifier ensuite son rendu et ses validations dans la landing.

Les données servent uniquement à gérer les candidatures et les invitations. La notice près du formulaire précise leur conservation jusqu’à la fin de la bêta. À cette échéance, supprimer les réponses dans Tally et les éventuels exports conservés. Ce nettoyage est manuel, sans échéance automatisée. Les demandes de retrait et de suppression arrivent à l’adresse de l’éditeur indiquée dans la notice.

## Identité et sources

- Les WebP de `public/mentis` proviennent des éléments d’onboarding fournis par Hugo dans `.private/web-landing-page/elements` du worktree principal. Ils sont optimisés avant publication ; le site ne dépend pas du dossier privé.
- Inter Tight Regular réutilise le fichier du mobile. Epunda Slab Medium utilise la fonte variable officielle [Google Fonts](https://github.com/google/fonts/tree/main/ofl/epundaslab), avec sa licence OFL dans `public/fonts/mentis`.
- `public/mentis/social-preview.png` est l’aperçu social 1200 × 630. Le titre, la description et les métadonnées sont définis dans `src/app/mentis/page.tsx`.
- La question de démonstration est entièrement locale. Réponse vérifiée : Ojos del Salado, [Smithsonian Global Volcanism Program](https://volcano.si.edu/volcano.cfm?vn=355130).

## Vérification manuelle du formulaire

Tester les champs vides, un e-mail invalide, chaque système mobile, le consentement non coché et le CAPTCHA. Une soumission réelle doit être confirmée dans l’onglet Submissions de Tally par le propriétaire du compte. Les tests unitaires des messages et une simulation de confirmation ne prouvent pas à eux seuls l’enregistrement chez Tally. Tester aussi le chargement bloqué, le lien direct, la reprise et le retour clavier vers la confirmation. Ne pas automatiser le CAPTCHA.

# Site public et landing Mentis

Next.js exporte le site statiquement dans `out/`. La configuration Vercel et les pages légales restent communes au site. Pour lancer le site depuis la racine :

```sh
bun run --filter @mentis/web dev
bun run --filter @mentis/web build
bun run check
```

## Téléchargement

L’app iOS est sur l’[App Store](https://apps.apple.com/app/id6804975526). Le QR code `public/mentis/app-qr.svg` pointe vers `/mentis/app`, qui redirige l’iPhone et l’iPad vers l’App Store, Android vers la bêta et le reste vers la landing. Ne le regénérer que si cette URL change :

```sh
bunx qrcode@1.5.4 -t svg -e M -d "#250313" -l "#0000" -o public/mentis/app-qr.svg "https://frogster-studio.com/mentis/app"
```

Retirer ensuite l’en-tête `<?xml …?><!DOCTYPE …>` et ajouter un `<title>` : Biome l’exige.

Le badge `public/mentis/app-store-badge.svg` est le badge officiel d’Apple (noir, fr-fr), tiré de [l’outil marketing d’Apple](https://toolbox.marketingtools.apple.com/).

## Liste d’attente Android

La page `/mentis` intègre le formulaire public [Tally xXGJZy](https://tally.so/r/xXGJZy). Son identifiant est dans `src/features/mentis/waitlist-config.ts`. Aucune clé API, base de données ou route serveur n’est nécessaire.

Le formulaire est chargé à l’approche de la section bêta. Tally gère les champs obligatoires, la validation de l’e-mail, le consentement, le CAPTCHA et l’enregistrement. Le script officiel adapte la hauteur de l’iframe. Le composant ne confirme la candidature qu’après un événement `Tally.FormSubmitted` provenant de l’iframe attendue, de `https://tally.so`, et du bon formulaire. Une panne de chargement affiche un bouton de reprise et un lien direct. Les réponses ne sont jamais copiées dans le site ni ses journaux.

Hugo administre Tally lui-même. Conserver les champs prénom, nom, adresse du compte Google Play et consentement obligatoire. Garder les instructions concernant le compte Google et l’absence de mot de passe demandé. Une modification du formulaire dans Tally est publiée indépendamment de Git : vérifier ensuite son rendu et ses validations dans la landing.

Les données servent uniquement à gérer les candidatures et les invitations. La notice près du formulaire précise leur conservation jusqu’à la fin de la bêta. À cette échéance, supprimer les réponses dans Tally et les éventuels exports conservés. Ce nettoyage est manuel, sans échéance automatisée. Les demandes de retrait et de suppression arrivent à l’adresse de l’éditeur indiquée dans la notice.

## Identité et sources

- Les illustrations de `public/mentis` proviennent des nouveaux exports haute définition fournis par Hugo. Les sources sont conservées localement hors du dossier public, dans `.private/web-landing-page/elements-hd` du worktree de la landing. Les illustrations sont compressées en WebP ; les variantes de la statue (490/735 px) et de la montagne (688/1024/1536 px) sont sélectionnées par le navigateur selon la largeur et la densité de l’écran. Les autres illustrations sont dimensionnées pour leur affichage haute densité. L’illustration de bonne réponse conserve sa source initiale, déjà suffisante.
- Les six étiquettes sont des SVG vectoriels aux textes tracés ; les effets de flou d’arrière-plan inutiles de l’export Figma sont retirés. La coquille « GRÉOGRAPHIE » a été corrigée dans les tracés de `geography.svg`.
- Le header utilise `public/mentis/logo.svg` pour le symbole et conserve le composant `LogoWordmark` pour la typographie. Le même symbole sert aux favicons SVG et ICO (16/32/48 px) et à l’icône Apple (180 px), sur fond beige pour rester lisible. Les métadonnées de ces icônes sont limitées à `/mentis`.
- Inter Tight Regular réutilise le fichier du mobile. Epunda Slab Medium utilise la fonte variable officielle [Google Fonts](https://github.com/google/fonts/tree/main/ofl/epundaslab), avec sa licence OFL dans `public/fonts/mentis`.
- `public/mentis/social-preview.png` est l’aperçu social 1200 × 630. Le titre, la description et les métadonnées sont définis dans `src/app/mentis/page.tsx`.
- La question de démonstration est entièrement locale. Réponse vérifiée : Ojos del Salado, [Smithsonian Global Volcanism Program](https://volcano.si.edu/volcano.cfm?vn=355130).

## Vérification manuelle du formulaire

Tester les champs vides, un e-mail invalide, chaque système mobile, le consentement non coché et le CAPTCHA. Une soumission réelle doit être confirmée dans l’onglet Submissions de Tally par le propriétaire du compte. Les tests unitaires des messages et une simulation de confirmation ne prouvent pas à eux seuls l’enregistrement chez Tally. Tester aussi le chargement bloqué, le lien direct, la reprise et le retour clavier vers la confirmation. Ne pas automatiser le CAPTCHA.

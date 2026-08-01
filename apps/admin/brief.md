I want to create a back-office to CRUD an important list of general knowledge (GK) content. Each content is a little piece of GK is a specific type of. Each content can be a

#1 Quizz: A question or an assertion and four answers with only one true.
example:

```
Quel est la durée de règne du Roi de France le plus court ? 20 minutes ? 127 heurs ? (un peu plus de 5 jours), 30 jours tout pile ? ou 14h ? (ah non ça c’est le gouvernement de Sébastien Lecornu en Octobre, c’est pas la bonne réponse c’est sûr…)

C’est Louis Antoine d’Artois dit Louis XIX qui n’a été roi que 20 minutes.

Et oui, parce qu’en 1830 (c’est la seule date à retenir, promis 1830), il y a Charles X, son père qui est très impopulaire parce qu’il y a des révoltes à cette époque. Le père Charles X abdique, il renonce au throne et comme Louis Antoine (Louis 19) est le fils ainé, il devient roi. Sauf que son père lui intime l’ordre d’abdiquer à son tour, parce que il veut laisser la place à Henri V, son neveu qui a une meilleure cote de popularité.
```

#2 Right or false : A assertion and the answer is either right or false.
example:

```
Il y a plus de risques de mourir d’une chute de noix de coco que d’une attaque de requin ? Vrai ou faux ? Je te laisse 1min30 pour réfléchir.

Nan, c’est bon.

Et bah c’est vrai vrai ! Les noix de coco tuent environ 150 personnes par an et les requins seulement une vingtaine ! Après… un noix de coco ça risque pas de te mordre…
```

#3 Anecdote: just a fact, no question for the user/listener.
example:

```
Les femmes ne se sont pas toujours mariés avec une robe de couleur blanche. À l’ééépoque, elles portaient très souvent du rouge parce que c’était la teinture la plus facile à obtenir pour les teinturiers alors que la robe bllanche coutaient beaucoup plus chère. Au moyen-age le blanc était même associé au deuil.

La tradition du mariage en blanc ne date que de la fin du 18eme siécle.
```

#4 A riddle
example:

```
C’est un homme politique de la IVème république donc avant 1960.

Il est connu pour deux trucs :

Avoir négocié la fin de guerre d’Indochine en un mois (sinon il s’engageait à démissioné d’ailleurs).

Avoir instaurer un verre de lait quotidien pour tous les élèves de France parce qu’il voulait lutter contre la dénutrition et l’alcoolisme (ouai avant on donnait de la bière ou du vin aux enfants…)

Cet homme c’est Pierre Mendès France.

Et pour info, la guerre d’Indochine, c'est le conflit de 8 ans de décolonisation où la France a perdu l'Indochine face aux communistes du Viêt Minh. Ça a fait 80 000 morts francais.
```

#5 Did you know it?

```
Les gens qui font du DROIT, vous pouvez scroller, vous le savez déjà.

L’Habeas Corpus en latin signifie un droit fondamental qu’on a en France et dans beaucoup d’autres pays, qui protège tous citoyens de l’emprisonnement arbitraire.

C’est à dire qu’aucune personne ne peut être arrêté sans connaitre la raison, le POURQUOI qui l’a fait arrêté.

En gros, sans ce droit, un roi ou un État pourrait enfermer n’importe qui sans raison.
```

For now, there are only these 5 types of GK type of content.
I want a really simple back-office where we can CRUD these GK content.

I want these content to be stored in supabase database,
I want to use a simply auth with oinly allowlist emails (one env variable that list all allow emails) with just a fix password (env variable secret on vercel).
Using vercel for deployment.
Tailwind and shadcn for the styling. For Tailwind, `SKY` and `ZINC` color palette from tailwind will be the main colors.
Buttons will border with lucide react icons.
We can associated 0 to 3 images per GK content. These images must be uploaded by the users with no limit of weigth but size of minimum 1000px height and width is required, format are `.png`, `.jpg`, `.jpeg`, `.webp`. Then, when user click on "create" or "update" the GK content, the uploaded images must be reworked to compress them, minimise their file size as much as possible, and automatically convert them to .webp. These images will be stored in a supabase bucket. If the rework and compression failed, each image must failed independtly, it means that when hitting create or update, the GK content must be stored, the images must be rework if new images, a red strip with message must appear on each failed image thumbnails. Then, the user understand that everything was stored expect some images and it can try again or just remove the image from the associated images. The creation or the update of a GK content must be in a sidebar (half the screen's width) to avoid a poor navigation to multiples pages and decrease the UX. When a GK content "is opened" the url must be update to facilitate the sharability.

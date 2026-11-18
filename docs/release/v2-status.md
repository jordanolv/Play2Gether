# Publication v2 — 16 novembre 2026

## Apple

- Version publique vérifiée : 1.2.
- Build 2.0.0 (29) : VALID, TestFlight interne IN_BETA_TESTING.
- Version 2.0.0 créée dans App Store Connect : PREPARE_FOR_SUBMISSION.
- Identifiant de version : 44576fba-f542-43cf-8a6d-333a1fb42f24.
- Build 29 associé : b7f2c647-6143-4d50-b0dd-da4824f79301.
- Notes de version françaises enregistrées.
- Aucun envoi en App Review effectué.
- Fiche et captures de la version publique sauvegardées dans store/apple/. Le fichier metadata-live-1.2.json est une archive, pas une configuration à publier.

### À résoudre avant validation

La déclaration actuelle indique NONE pour les thèmes adultes et le contenu sexuel. Les cartes du niveau adult dans data/truthordare-fr.json et data/truthordare-en.json contiennent des instructions sexuelles explicites. Le badge 18+ ne suffit pas à résoudre l'incompatibilité avec la règle Apple 1.1.4 : https://developer.apple.com/app-store/review/guidelines/#objectionable-content

Une adaptation du contenu implique une décision produit ; aucun niveau ni aucune carte n'a été supprimé. Après cette adaptation : nouveau build, déclaration d'âge exacte, captures correspondant à la nouvelle interface, puis validation du dossier et soumission.

## Android

- Identifiant : com.jordan.olv.play2gether.
- Version : 2.0.0, versionCode 2.
- Build terminé et signé ; clé de signature conservée sur EAS.
- AAB : https://expo.dev/artifacts/eas/TQSS3TWMBRDaVsofFydrM_M3FpjQAothZxtTGEj3Oc8.aab
- Tentative EAS Submit bloquée : aucune clé de compte de service Google configurée.
- Aucune soumission Google Play créée.
- L'app n'a pas encore été publiée sur Google Play, selon le propriétaire. La fiche Play Console et les accès de publication restent à configurer.

## Notes françaises enregistrées sur Apple

Nouvelle interface, nouveaux mini-jeux et contenus enrichis. Découvrez le mode caméra avec un overlay déplaçable et redimensionnable, ainsi que la mémorisation des cartes déjà jouées pour limiter les répétitions.

## Mise à jour — retrait du mode Adulte ++

Le niveau adult et toutes ses cartes FR/EN ont été supprimés. Les niveaux normal, couple et spicy restent disponibles. Le contrôle Coquin dans l'app indique désormais 16+.

TypeScript, lint et git diff --check passent. Nouveaux builds lancés :
- iOS 30 : e8f87140-88f7-4116-9ae0-460754abf58a
- Android 3 : 44e38f69-27fd-4148-97f4-b2ec4e5de184
- Envoi iOS programmé : 8187f1c8-503a-47fc-b9b5-93abbe642575

L'ancien build 29 a été détaché du brouillon pour éviter de soumettre le contenu retiré. Le nouveau build devra être associé une fois traité par Apple.

Déclaration d'âge du brouillon corrigée : thèmes suggestifs fréquents, contenu sexuel non graphique occasionnel, références occasionnelles à l'alcool, aucun contenu sexuel graphique. Aucun surclassement volontaire. Apple renvoie SEVENTEEN_PLUS dans le champ historique et EIGHTEEN pour la France et le Brésil. La suppression d'Adulte ++ ne suffit donc pas à obtenir un classement inférieur en France tant que Coquin conserve ses thèmes suggestifs fréquents. Aucune classification plus basse n'est annoncée comme validée.

## Préparation de la publication

- Build iOS 30 : terminé sur EAS ; transfert App Store Connect en cours au dernier contrôle. Pas encore visible dans l’API Apple, donc pas associé au brouillon.
- Description française et notes pour App Review mises à jour.
- Ancien domaine jordanolivier.dev inaccessible (échec DNS).
- Pages de support et de confidentialité corrigées et publiées sur https://jordanolv.github.io/Play2Gether/ via la branche gh-pages. Réponses HTTP 200 vérifiées ; URLs du brouillon Apple mises à jour.
- Captures héritées de la v1 toujours présentes : elles ne représentent pas la nouvelle interface. Leur remplacement reste nécessaire avant de considérer le dossier prêt.
- Le simulateur distant EAS n’est pas disponible pour ce compte. Aucun accès local à un simulateur iOS n’a été établi.
- Le propriétaire confirme avoir un compte Google Play. Une demande sécurisée de clé de compte de service a été ouverte ; aucune clé Google reçue à ce stade.
- Aucune soumission en App Review ni publication Google Play effectuée.

## Connexion Google Play

- Clé de service reçue, authentification Google réussie, clé enregistrée sur EAS pour com.jordan.olv.play2gether. Aucun secret ajouté au dépôt.
- API Google Play Android Developer activée dans le projet Google Cloud avec les accès disponibles.
- Vérification directe de l'application : HTTP 404 « Package not found: com.jordan.olv.play2gether ». URL de la fiche Play Console demandée pour vérifier l'identifiant et l'accès.
- Envoi Android du build 3 programmé en brouillon sur la piste interne : 7b12e96e-1f27-418a-8bcd-e8e79f486ee4. La programmation EAS ne confirme pas l'acceptation Google Play.

## Reprise (16/11/2026)

- Fiche Play publique : HTTP 404. L'app n'existe pas encore dans Play Console : création de l'app et premier AAB à importer à la main, puis invitation de expo-submit@play2gether-514918.iam.gserviceaccount.com dans Utilisateurs et autorisations.
- Build Android 3 (44e38f69…) encore en file d'attente EAS ; soumission 7b12e96e… en attente du build.
- Build iOS 30 pas encore visible chez Apple ; soumission 8187f1c8… en file d'attente.
- Accès du compte de service accordé. Build 2.0.0 (versionCode 2) importé via l'API et publié en brouillon sur la piste de test interne de com.jordan.olv.play2gether (commit 200).
- Une seconde fiche vide com.jordanolv.play2gether (sans point) existe dans Play Console ; elle n'est pas utilisée.

## Fiches et visuels (16/11/2026)

- Série de 6 captures promo (accueil + 5 jeux) générée depuis l'export web de la v2, gabarit store/promo/slide.html. Fichiers dans store/promo/.
- Google Play (fr-FR) : titre, description courte et longue, icône, bannière 1024×500, 6 captures, e-mail et site de contact enregistrés via l'API.
- App Store 2.0.0 (fr-FR) : captures iPhone 6,9" et iPad 13" de la v1 remplacées par la nouvelle série.
- Icône actuelle (assets/images/icon.png) : faute « Play2Getther » dans le dessin, à refaire.
- Reste dans Play Console (pas d'API) : catégorie, classification du contenu, public cible, sécurité des données, publicités, accès à l'app, règles de confidentialité.
- Nouvelle icône (couple + cartes ? !, style Néon Nuit, source store/promo/icon.svg) : assets/images (icon, adaptive-icon + adaptive-icon-background, splash-icon, favicon), app.json (fond adaptatif et splash #121022). Envoyée sur la fiche Play. Visible dans l'app au prochain build.
- Build Android 4 (d217c7ea…, nouvelle icône) publié automatiquement en test interne (completed). eas.json : releaseStatus Android passé à completed.

## Mise en production (17/11/2026)

- iOS : build 31 (nouvelle icône) VALID, rattaché à la 2.0.0, notes App Review mises à jour, soumis à l'App Review (reviewSubmission 56ee57be…, WAITING_FOR_REVIEW). Publication automatique après validation.
- Android : production refusée par l'API (FAILED_PRECONDITION, accès production non accordé). App encore en statut brouillon chez Google. Build 4 placé en brouillon sur le test fermé (alpha) : testeurs à ajouter et envoi pour examen à faire dans Play Console ; 12 testeurs / 14 jours si exigé.

## Validation Apple (17/11/2026)

- 2.0.0 (build 31) validée par App Review : READY_FOR_SALE, publiée automatiquement sur l'App Store.

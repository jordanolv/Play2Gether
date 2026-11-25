# AGENTS.md — Play2Gether

## Résumé
Application mobile de jeux à deux (couple/amis) : Action ou Vérité, Tu préfères, Qui de nous deux,
Mot de passe, Petit Bac, Du coq à l'âne (échelle de mots), plus un « mode caméra/filtre » et Studio Story.
Publiée sur l'App Store (2.0.x) ; Google Play en test fermé. Site vitrine : dossier `website/`.
Le package s'appelle `duo-games` (nom npm), l'app `Play2Gether` (slug `play2gether`).

## Stack
- Expo SDK 58, React Native 0.88, React 19, TypeScript 6 (strict), expo-router (routage par fichiers).
- i18next / react-i18next (FR + EN), AsyncStorage pour la persistance locale, reanimated, expo-camera.
- ESLint (`eslint-config-expo`). Aucun test automatisé dans le dépôt.
- Builds : EAS (`eas.json`) ; iOS construit sur un runner macOS GitHub Actions.

## Structure
- `app/` : écrans (routes). `app/games/*.tsx` = un fichier par jeu ; `filter.tsx` (mode caméra),
  `story.tsx` (Studio Story), `index.tsx` (accueil), `theme.ts` (design « Néon Nuit »).
- `components/ui/` : composants partagés (Button, Screen, GameHeader, LaunchSheet…) ;
  `components/filter/`, `story/`, `wouldyourather/` : composants propres à ces fonctions.
- `data/` : contenu des jeux en JSON, un fichier par langue (`*-fr.json`, `*-en.json`) ; `games.json`.
- `locales/` : textes de l'UI (`fr.json`, `en.json`).
- `utils/` : logique (i18n, tirage aléatoire, mémoire des cartes déjà vues `seen.ts`, streak, couple…).
- `constants/`, `assets/` : constantes, images/polices.
- `website/` : pages HTML statiques (accueil, support, confidentialité). `docs/release/` : suivi de publication.
- `store/` : visuels et métadonnées des stores. `.eas/`, `eas.json`, `app.json` : config build/app.

## Conventions
- UI et contenu en français par défaut ; toute chaîne visible passe par `locales/` (FR **et** EN)
  et tout contenu de jeu a ses deux fichiers `-fr`/`-en`.
- Alias d'import `@/` (racine du dépôt). Fonctions/composants en TypeScript, un écran par jeu.
- Style visuel « Néon Nuit » (thème sombre) : réutiliser `app/theme.ts` et `components/ui/`.
- Commits en français, conventional commits (`feat:`, `fix:`, `content(...)`, `docs:`, `ci:`, `chore:`).

## Mode caméra (écran `app/filter.tsx`)
- L'image prête à enregistrer ne montre que la caméra et l'overlay du jeu : aucune aide, aucun bouton.
- Un **appui** n'importe où joue ; un **appui long (600 ms) sur le fond** (pas sur la carte, qui se déplace/pince
  et se remet en place par appui long) ouvre les réglages (`components/filter/CameraSettings.tsx`) : quitter,
  overlay affiché/masqué, présentation (plusieurs pour « Qui de nous deux » : carte/bandeau), remise en place,
  niveau d'Action ou Vérité. Alternative VoiceOver/TalkBack : action d'accessibilité « Afficher les réglages ».
- Réglages ouverts : une couche transparente couvre le jeu et le placement (un appui dessus referme sans jouer ;
  un glissement est absorbé : ni fermeture, ni jeu, ni placement) ; le panneau (≤ 46 % de la hauteur, défilant) laisse l'overlay visible dessous : pendant les
  réglages il est rendu à son ancre d'origine, jamais agrandi, sans toucher à sa position/taille de partie (rétablies à la fermeture). Échap (web) et Retour (Android) referment d'abord les réglages, sans quitter la partie.
- Web : bouton « Afficher les réglages » atteignable à la touche Tab, visible seulement au focus en modalité clavier (pas après un geste tactile/souris) ; le focus
  entre dans le panneau à l'ouverture et revient au bouton à la fermeture.
- Ces gestes (glisser/pincer, appui long overlay vs fond) sont enseignés par la mini-instruction qui s'ouvre depuis
  l'accueil (`components/ui/LaunchSheet.tsx`, clés `intro.*`) ; en Action ou Vérité, caméra = Normal et Couple.

## Commandes
Toutes exécutées avec succès dans ce worktree :
- Installer : `npm ci --no-audit --no-fund --prefer-offline`
- Dev : `npx expo start` (Expo Go / dev client) ; `npx expo start --web` pour un aperçu navigateur.
- **Vérification avant PR** :
  1. `npm run lint` (= `expo lint`, code retour 0)
  2. `npx tsc --noEmit` (code retour 0)
  3. `npx expo export --platform web` (build de contrôle, code retour 0 ; génère `dist/`, ignoré par git)
- Pas de tests unitaires : valider les changements d'UI/jeu en lançant l'app si possible.

## Git et déploiement
- Branche de base : `main`. Branches de travail + PR ; ne pas pousser directement sur `main`.
- Aucun déploiement automatique au merge. Seul workflow : `.github/workflows/ios-build.yml`,
  **déclenché manuellement** (build iOS `eas build --local` + envoi App Store Connect). Ne pas le lancer.
- Ne pas commiter : `node_modules/`, `dist/`, `.expo/`, `expo-env.d.ts`, clés (`*.p8`, `*.jks`, `*.key`…),
  `.env*.local`.
- Version de l'app : `package.json` et `app.json` ; `eas.json` utilise `autoIncrement` (version distante).

## Pièges
- Secrets CI (`EXPO_TOKEN`, `ASC_KEY_P8`, `ASC_KEY_ID`, `ASC_ISSUER_ID`) uniquement côté GitHub ;
  aucun `.env` dans le dépôt. Ne jamais les écrire dans le code.
- `eas.json` contient des identifiants de soumission App Store : ne pas les modifier sans demande.
- Le mode caméra/filtre et `expo-camera` ne fonctionnent pas sur le web : tester sur appareil.
- Contenu 16+ (Action ou Vérité « Coquin ») : conserver la confirmation d'âge.
- `npm ci` affiche des avertissements `install-scripts` : sans gravité.

# Guide d'auto-hébergement — Quiz (Duel Mondial des Pays)

Ce projet contient l'intégralité du code source (React, TypeScript, Tailwind CSS, Express, WebSocket, Firebase Firestore) ainsi que le dossier `dist/` prêt pour la production.

## 1. Télécharger l'archive complète depuis Google AI Studio

1. Dans la barre supérieure de Google AI Studio Build (en haut à droite), cliquez sur l'icône **Télécharger l'application (Download app)** pour obtenir l'archive `.zip` complète de tous les fichiers.
2. Vous pouvez aussi cliquer sur **Save to GitHub** pour envoyer directement tout le code sur votre dépôt GitHub.

## 2. Prérequis pour l'hébergement

L'application utilise un frontend Vite/React + un backend Node.js (`server.ts`) pour le classement mondial en temps réel et les duels 1v1 en WebSocket, ainsi que **Cloud Firestore** et **Google Auth**.

- **Node.js 22+** (ou Docker)

## 3. Lancer en local ou sur un VPS / serveur Node.js

```bash
npm install
npm run build
npm start
```

Par défaut le serveur écoute sur le port `3000` (ou sur la variable d'environnement `PORT`).

## 4. Héberger avec Docker / Cloud Run / Railway / Render

Un `Dockerfile` prêt à l'emploi est inclus à la racine :

```bash
docker build -t quiz-app .
docker run -p 8080:8080 quiz-app
```

## 5. Connecter votre nom de domaine (Important pour Google Sign-In)

Lorsque vous hébergez l'application sur votre propre nom de domaine (ex. `https://mondomaine.com`) :

1. Faites pointer un enregistrement DNS (`A` ou `CNAME`) vers votre hébergeur (Cloud Run, VPS, Railway, Render...).
2. Ouvrez la **Console Firebase** du projet `polished-cosine-vl37k` :
   - Allez dans **Authentication → Settings → Authorized domains**
   - Ajoutez votre nom de domaine (`mondomaine.com`) afin que la connexion Google fonctionne dessus.

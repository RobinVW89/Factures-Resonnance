# Factures Résonance

Application web de génération de factures pour l'**Association RÉSONANCE ICAUNAISE**.

## 🚀 Démo

[https://farteryhr.github.io/Factures-Resonnance/](https://farteryhr.github.io/Factures-Resonnance/)

## ✨ Fonctionnalités

- 📋 **Tableau de bord** avec statistiques (total, payées, à payer, encaissé)
- ✏️ **Éditeur de factures** complet (émetteur, client, lignes, TVA, remises)
- 👁️ **Aperçu en temps réel** de la facture au format A4
- 📄 **Export PDF** via pdf-lib (fonts Helvetica embarquées)
- 🔢 **Numérotation automatique** par année (ex. 2025-0001)
- 💾 **Persistance locale** (localStorage) — aucun serveur requis
- 📤 **Import / Export JSON** pour sauvegarde et transfert
- 🌙 **Mode sombre** complet (Tailwind CSS `darkMode: 'class'`)
- 🔍 **Recherche et tri** dans la liste des factures
- 📱 Interface responsive

## 🛠️ Stack technique

- **React 18** + **TypeScript**
- **Vite 6** (build et dev server)
- **Tailwind CSS 3** (styling + dark mode)
- **pdf-lib** (génération PDF côté client)
- **react-router-dom v6** (HashRouter pour GitHub Pages)
- **Vitest** (tests unitaires)

## 🏃 Démarrage rapide

```bash
npm install
npm run dev
```

## 🧪 Tests

```bash
npm test
```

## 📦 Build production

```bash
npm run build
```

## 📁 Structure

```
src/
├── types/        # TypeScript types (Invoice, Party, Item…)
├── lib/          # Logique métier (formatters, pdf, storage, numérotation)
├── components/   # Composants React réutilisables
├── pages/        # Pages (Dashboard, Editor)
└── __tests__/    # Tests unitaires
```

## 📜 Licence

Usage interne — Association RÉSONANCE ICAUNAISE.

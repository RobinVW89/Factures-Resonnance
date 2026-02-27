# Factures Résonance

Application de facturation React + Vite, avec sauvegarde locale et synchronisation cloud optionnelle.

## Développement local

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

## Sauvegarde en ligne (Cloudflare Pages + KV)

Le projet inclut une API Pages Functions: [functions/api/invoices.js](functions/api/invoices.js).

### 1) Créer un namespace KV

Dans Cloudflare > Workers & Pages > KV, crée un namespace (ex: `factures-resonance-kv`).

### 2) Lier le namespace à ton projet Pages

Dans ton projet Pages > Paramètres > Fonctions > Liaison KV:

- Nom de variable: `INVOICES_KV`
- Namespace: `factures-resonance-kv`

### 3) Ajouter un token de protection (recommandé)

Dans Pages > Variables et secrets (Production):

- `SYNC_TOKEN` (secret côté serveur)
- `VITE_SYNC_TOKEN` (même valeur, variable build côté front)

Tu peux aussi définir `VITE_SYNC_ENDPOINT` si tu veux pointer vers une autre API.

### 4) Déployer

Chaque sauvegarde d’une facture enverra automatiquement les données vers `/api/invoices`.

## Notes

- Sans binding KV, l’app continue de fonctionner en localStorage uniquement.
- Les données cloud sont isolées par appareil (ID local du navigateur).

---

## Template Vite (historique)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

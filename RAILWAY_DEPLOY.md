# Déploiement sur Railway

## Prérequis

- Un compte [Railway](https://railway.app)
- La [CLI Railway](https://docs.railway.app/develop/cli) installée (optionnel)

## Déploiement en 3 étapes

### 1. Créer un projet Railway

Depuis le dashboard Railway :
1. Cliquez **New Project**
2. Choisissez **Deploy from GitHub repo**
3. Sélectionnez ce repository `sallystoire/Sally`

Railway détectera automatiquement le `Dockerfile` et lancera le build.

### 2. Ajouter une base de données PostgreSQL

1. Dans votre projet Railway, cliquez **+ New**
2. Choisissez **Database → PostgreSQL**
3. Railway génère automatiquement la variable `DATABASE_URL` et la partage avec votre service

### 3. Configurer les variables d'environnement

Dans **Variables** de votre service, ajoutez :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Injectée automatiquement par Railway si vous ajoutez PostgreSQL |
| `SESSION_SECRET` | Une chaîne secrète aléatoire (ex: `openssl rand -hex 32`) |
| `NODE_ENV` | `production` |
| `PORT` | Railway injecte `$PORT` automatiquement — ne pas surcharger |

> **Note** : Railway injecte `$PORT` automatiquement dans tous les services. Ne le définissez pas manuellement.

## Migrations de base de données

Pour appliquer le schéma Drizzle en production, vous pouvez utiliser le service Railway ou la CLI :

```bash
railway run pnpm --filter @workspace/db run push
```

## Structure du déploiement

```
Dockerfile
  └── Build Stage  : pnpm install + esbuild bundle
  └── Runner Stage : Node.js 24 + dist/index.mjs
```

Le serveur écoute sur `$PORT` et expose :
- `GET /api/healthz` — health check (utilisé par Railway)

## Déploiement via CLI

```bash
# Installer la CLI
npm install -g @railway/cli

# Se connecter
railway login

# Lier au projet
railway link

# Déployer
railway up
```

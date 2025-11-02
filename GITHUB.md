# 🚀 Instructions GitHub

## Méthode automatique (Recommandée)

```bash
# 1. Rendre le script exécutable
chmod +x setup-github.sh

# 2. Exécuter le script
./setup-github.sh

# 3. Créer le repo sur GitHub
# Aller sur: https://github.com/new
# - Repository name: lnbits-ark-wallet
# - Description: Ark Wallet extension for LNbits with Lightning Network
# - Public
# - NE PAS ajouter README, .gitignore ou LICENSE

# 4. Lier et pousser
git remote add origin https://github.com/Silexperience210/lnbits-ark-wallet.git
git push -u origin main
```

## Méthode manuelle

```bash
# 1. Initialiser Git
git init

# 2. Ajouter les fichiers
git add .

# 3. Commit initial
git commit -m "🎉 Initial commit - Ark Wallet Pro v1.0.0"

# 4. Créer branche main
git branch -M main

# 5. Créer le repo sur GitHub (https://github.com/new)

# 6. Ajouter remote
git remote add origin https://github.com/Silexperience210/lnbits-ark-wallet.git

# 7. Push
git push -u origin main
```

## Configuration Git (si nécessaire)

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"
```

## Vérifications

```bash
# Vérifier le statut
git status

# Vérifier les remotes
git remote -v

# Vérifier les branches
git branch -a
```

## Commandes utiles

```bash
# Créer une nouvelle branche
git checkout -b feature/nouvelle-feature

# Revenir à main
git checkout main

# Voir l'historique
git log --oneline

# Créer un tag version
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

## Après le push

Votre repo sera disponible à :
**https://github.com/Silexperience210/lnbits-ark-wallet**

## Créer une release

1. Aller sur GitHub > Releases
2. Click "Create a new release"
3. Tag: v1.0.0
4. Title: Ark Wallet Pro v1.0.0
5. Description: Premier release de l'extension
6. Publier

## Archive pour release

```bash
# Créer l'archive
git archive --format=zip --output=lnbits-ark-wallet-v1.0.0.zip HEAD

# Uploader sur GitHub Releases
```

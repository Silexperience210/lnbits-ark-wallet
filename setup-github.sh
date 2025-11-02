#!/bin/bash
#
# Script d'initialisation Git pour Ark Wallet Pro
# Usage: ./setup-github.sh
#

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Ark Wallet Pro - Setup GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier si Git est installé
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git n'est pas installé${NC}"
    echo "Installez Git: sudo apt install git"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git installé"

# Configuration Git (si pas déjà fait)
if [ -z "$(git config --global user.name)" ]; then
    echo ""
    echo -e "${YELLOW}Configuration Git nécessaire${NC}"
    read -p "Votre nom: " git_name
    read -p "Votre email: " git_email
    git config --global user.name "$git_name"
    git config --global user.email "$git_email"
    echo -e "${GREEN}✓${NC} Git configuré"
fi

# Initialiser le repo Git
echo ""
echo -e "${BLUE}Initialisation du repository...${NC}"

# Initialiser
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "🎉 Initial commit - Ark Wallet Pro v1.0.0

- Extension LNbits complète
- Wallet Ark sécurisé (AES-256-GCM)
- Intégration Lightning Network via Boltz
- Interface futuriste néon plasma blanc & bleu
- API REST complète
- Support multi-réseaux (mainnet/testnet/mutinynet)"

echo -e "${GREEN}✓${NC} Repository initialisé"

# Créer la branche main
git branch -M main

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup local terminé !${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Instructions pour GitHub
echo -e "${YELLOW}📋 Prochaines étapes :${NC}"
echo ""
echo "1️⃣  Créer le repo sur GitHub :"
echo "   ${BLUE}https://github.com/new${NC}"
echo "   Nom: ${GREEN}lnbits-ark-wallet${NC}"
echo "   Description: ${GREEN}Ark Wallet extension for LNbits with Lightning Network${NC}"
echo "   Public ✓"
echo ""
echo "2️⃣  Lier votre repo local :"
echo "   ${BLUE}git remote add origin https://github.com/Silexperience210/lnbits-ark-wallet.git${NC}"
echo ""
echo "3️⃣  Pousser le code :"
echo "   ${BLUE}git push -u origin main${NC}"
echo ""
echo -e "${YELLOW}OU utilisez la commande complète :${NC}"
echo ""
echo -e "${GREEN}git remote add origin https://github.com/Silexperience210/lnbits-ark-wallet.git && git push -u origin main${NC}"
echo ""
echo -e "${YELLOW}💡 Astuce :${NC} Créez d'abord le repo vide sur GitHub (sans README/LICENSE)"
echo ""

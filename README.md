# Ark Wallet Pro - Extension LNbits

Extension LNbits pour wallet Ark avec intégration Lightning Network via Boltz.

## Installation

```bash
# Copier dans LNbits
cp -r ark-wallet-minimal /path/to/lnbits/lnbits/extensions/ark_wallet

# Redémarrer LNbits
cd /path/to/lnbits
poetry run lnbits

# Activer l'extension dans l'interface
```

## Fonctionnalités

- Wallet Ark sécurisé (AES-256-GCM)
- Mnémonique BIP39 (12 mots)
- Transactions instantanées (VTXOs)
- Lightning Network via Boltz
- Interface néon plasma blanc & bleu

## Configuration

Réseaux supportés :
- Mainnet : `https://mainnet.arklabs.to`
- Testnet : `https://testnet.arklabs.to`
- Mutinynet : `https://master.mutinynet.arklabs.to`

## Sécurité

⚠️ Version BETA - Testez sur testnet d'abord !
- Sauvegardez votre mnémonique
- Utilisez un mot de passe fort
- Testez avec petites sommes

## License

MIT

/**
 * Ark Wallet Core Module
 * Handles Ark SDK integration, encryption, and wallet operations
 */

import { generateMnemonic, mnemonicToSeed } from 'https://cdn.jsdelivr.net/npm/bip39@3.1.0/src/index.js';
import QRCode from 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';

class ArkWalletCore {
  constructor() {
    this.wallet = null;
    this.config = null;
    this.refreshInterval = null;
  }

  /**
   * Initialize wallet core
   */
  async init() {
    try {
      // Load configuration
      this.config = await this.loadConfig();
      console.log('Ark Wallet Core initialized', this.config);
      return true;
    } catch (error) {
      console.error('Failed to initialize Ark Wallet Core:', error);
      return false;
    }
  }

  /**
   * Load configuration from API
   */
  async loadConfig() {
    try {
      const response = await fetch('/ark_wallet/api/config');
      if (!response.ok) throw new Error('Failed to load config');
      return await response.json();
    } catch (error) {
      console.error('Config load error:', error);
      // Return default config
      return {
        networks: {
          mutinynet: {
            arkServerUrl: 'https://master.mutinynet.arklabs.to',
            boltzApiUrl: 'https://api.testnet.boltz.exchange',
            enabled: true
          }
        },
        limits: {
          minSwapAmount: 100000,
          maxSwapAmount: 25000000,
          minOnboard: 50000
        }
      };
    }
  }

  /**
   * Create a new wallet with encrypted storage
   */
  async createWallet(password, walletName, network = 'mutinynet') {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      // Generate mnemonic
      const mnemonic = generateMnemonic(128); // 12 words
      const seed = await mnemonicToSeed(mnemonic);
      
      // Derive key from seed (first 32 bytes)
      const privateKeyBytes = seed.slice(0, 32);
      const privateKeyHex = Array.from(privateKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Encrypt the private key
      const encrypted = await this.encryptKey(privateKeyHex, password);
      
      // Store wallet in backend
      const walletData = {
        wallet_name: walletName,
        network: network,
        encrypted_key: JSON.stringify(encrypted)
      };

      const response = await fetch('/ark_wallet/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': window.user.wallets[0].adminkey
        },
        body: JSON.stringify(walletData)
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet in backend');
      }

      const wallet = await response.json();

      return {
        success: true,
        wallet: wallet,
        mnemonic: mnemonic
      };
    } catch (error) {
      console.error('Create wallet error:', error);
      throw error;
    }
  }

  /**
   * Load existing wallet from backend
   */
  async loadWallet(walletId, password) {
    try {
      // Fetch wallet from backend
      const response = await fetch(`/ark_wallet/api/wallets/${walletId}`, {
        headers: {
          'X-API-KEY': window.user.wallets[0].inkey
        }
      });

      if (!response.ok) {
        throw new Error('Wallet not found');
      }

      const walletData = await response.json();
      
      // Decrypt the private key
      const encrypted = JSON.parse(walletData.encrypted_key);
      const privateKeyHex = await this.decryptKey(encrypted, password);

      // Initialize Ark SDK wallet (placeholder - actual SDK integration needed)
      console.log('Wallet loaded successfully');
      
      return {
        success: true,
        wallet: walletData,
        privateKey: privateKeyHex
      };
    } catch (error) {
      console.error('Load wallet error:', error);
      throw new Error('Failed to load wallet. Check your password.');
    }
  }

  /**
   * Get wallet address (placeholder for Ark SDK)
   */
  async getAddress(walletData, privateKey) {
    // In production, this would use the Ark SDK
    // For now, derive a demo address from the key
    const hash = await this.sha256(privateKey);
    const addr = 'ark1' + hash.substring(0, 40);
    return addr;
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletId) {
    try {
      const response = await fetch(`/ark_wallet/api/wallets/${walletId}`, {
        headers: {
          'X-API-KEY': window.user.wallets[0].inkey
        }
      });

      if (!response.ok) throw new Error('Failed to get balance');
      
      const wallet = await response.json();
      return wallet.balance || 0;
    } catch (error) {
      console.error('Get balance error:', error);
      return 0;
    }
  }

  /**
   * Send Ark transaction
   */
  async sendArk(walletId, toAddress, amount, memo = null) {
    try {
      const data = {
        wallet_id: walletId,
        to_address: toAddress,
        amount: amount,
        memo: memo
      };

      const response = await fetch('/ark_wallet/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': window.user.wallets[0].adminkey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to send transaction');
      }

      return await response.json();
    } catch (error) {
      console.error('Send transaction error:', error);
      throw error;
    }
  }

  /**
   * Create Boltz swap
   */
  async createBoltzSwap(walletId, swapType, amount, invoice = null, onchainAddress = null) {
    try {
      const data = {
        wallet_id: walletId,
        swap_type: swapType,
        amount: amount,
        invoice: invoice,
        onchain_address: onchainAddress
      };

      const response = await fetch('/ark_wallet/api/swaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': window.user.wallets[0].adminkey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create swap');
      }

      return await response.json();
    } catch (error) {
      console.error('Create swap error:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for address
   */
  async generateQRCode(canvas, address) {
    try {
      await QRCode.toCanvas(canvas, address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0a0e27',
          light: '#ffffff'
        }
      });
    } catch (error) {
      console.error('QR code generation error:', error);
    }
  }

  /**
   * Encrypt private key using AES-GCM
   */
  async encryptKey(data, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      ),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      new TextEncoder().encode(data)
    );

    return {
      iv: Array.from(iv),
      salt: Array.from(salt),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  /**
   * Decrypt private key using AES-GCM
   */
  async decryptKey(encrypted, password) {
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(encrypted.salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      ),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
      key,
      new Uint8Array(encrypted.data)
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Helper: SHA-256 hash
   */
  async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Start auto-refresh interval
   */
  startRefresh(callback, interval = 10000) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.refreshInterval = setInterval(callback, interval);
  }

  /**
   * Stop auto-refresh
   */
  stopRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Export singleton instance
export const arkCore = new ArkWalletCore();

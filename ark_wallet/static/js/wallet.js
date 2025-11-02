/**
 * Ark Wallet Vue Application
 * Handles UI logic and user interactions
 */

import { arkCore } from './ark.js';

new Vue({
  el: '#vue',
  mixins: [windowMixin],
  data() {
    return {
      tab: 'wallet',
      currentWallet: null,
      wallets: [],
      walletAddress: '',
      transactions: [],
      swaps: [],
      refreshing: false,
      sending: false,
      swappingIn: false,
      swappingOut: false,
      showMnemonicDialog: false,
      mnemonicWords: [],
      sendForm: {
        address: '',
        amount: 0,
        memo: ''
      },
      swapInForm: {
        invoice: ''
      },
      swapOutForm: {
        amount: 100000,
        address: ''
      },
      config: null
    };
  },
  async mounted() {
    // Initialize Ark Core
    await arkCore.init();
    this.config = arkCore.config;
    
    // Load user wallets
    await this.loadWallets();
    
    // Load last used wallet from localStorage
    const lastWalletId = localStorage.getItem('ark_last_wallet');
    if (lastWalletId) {
      const wallet = this.wallets.find(w => w.id === lastWalletId);
      if (wallet) {
        await this.selectWallet(wallet);
      }
    }
  },
  methods: {
    /**
     * Load all user wallets
     */
    async loadWallets() {
      try {
        const response = await LNbits.api.request(
          'GET',
          '/ark_wallet/api/wallets',
          this.g.user.wallets[0].inkey
        );
        this.wallets = response.data;
      } catch (error) {
        console.error('Failed to load wallets:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load wallets',
          caption: error.message
        });
      }
    },

    /**
     * Create new wallet
     */
    async createWallet() {
      try {
        const password = await this.$q.dialog({
          title: 'Create Wallet',
          message: 'Enter a strong password to encrypt your wallet',
          prompt: {
            model: '',
            type: 'password',
            isValid: val => val.length >= 8
          },
          cancel: true
        });

        if (!password) return;

        const walletName = await this.$q.dialog({
          title: 'Wallet Name',
          message: 'Choose a name for your wallet',
          prompt: {
            model: 'My Ark Wallet',
            type: 'text'
          },
          cancel: true
        });

        if (!walletName) return;

        const network = await this.$q.dialog({
          title: 'Select Network',
          message: 'Choose which network to use',
          options: {
            type: 'radio',
            model: 'mutinynet',
            items: [
              { label: 'Mutinynet (Testnet)', value: 'mutinynet' },
              { label: 'Testnet', value: 'testnet' },
              { label: 'Mainnet', value: 'mainnet' }
            ]
          },
          cancel: true
        });

        this.$q.loading.show({ message: 'Creating wallet...' });

        const result = await arkCore.createWallet(password, walletName, network);

        this.$q.loading.hide();

        if (result.success) {
          // Show mnemonic backup dialog
          this.mnemonicWords = result.mnemonic.split(' ');
          this.showMnemonicDialog = true;
          
          // Reload wallets
          await this.loadWallets();
          
          // Select the new wallet
          const newWallet = this.wallets.find(w => w.id === result.wallet.id);
          if (newWallet) {
            await this.selectWallet(newWallet);
          }
        }
      } catch (error) {
        this.$q.loading.hide();
        console.error('Create wallet error:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to create wallet',
          caption: error.message
        });
      }
    },

    /**
     * Load existing wallet
     */
    async loadWallet() {
      try {
        if (this.wallets.length === 0) {
          this.$q.notify({
            type: 'warning',
            message: 'No wallets found',
            caption: 'Please create a wallet first'
          });
          return;
        }

        const walletId = await this.$q.dialog({
          title: 'Select Wallet',
          message: 'Choose a wallet to load',
          options: {
            type: 'radio',
            model: this.wallets[0].id,
            items: this.wallets.map(w => ({
              label: `${w.wallet_name} (${w.network})`,
              value: w.id
            }))
          },
          cancel: true
        });

        if (!walletId) return;

        const password = await this.$q.dialog({
          title: 'Enter Password',
          message: 'Enter your wallet password',
          prompt: {
            model: '',
            type: 'password'
          },
          cancel: true
        });

        if (!password) return;

        this.$q.loading.show({ message: 'Loading wallet...' });

        const result = await arkCore.loadWallet(walletId, password);

        this.$q.loading.hide();

        if (result.success) {
          const wallet = this.wallets.find(w => w.id === walletId);
          await this.selectWallet(wallet);
          
          this.$q.notify({
            type: 'positive',
            message: 'Wallet loaded successfully',
            icon: 'check_circle'
          });
        }
      } catch (error) {
        this.$q.loading.hide();
        console.error('Load wallet error:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load wallet',
          caption: error.message
        });
      }
    },

    /**
     * Select and activate a wallet
     */
    async selectWallet(wallet) {
      this.currentWallet = wallet;
      localStorage.setItem('ark_last_wallet', wallet.id);
      
      // Load wallet data
      await this.refreshWalletData();
      
      // Start auto-refresh
      arkCore.startRefresh(() => this.refreshWalletData(), 10000);
    },

    /**
     * Refresh wallet data
     */
    async refreshWalletData() {
      if (!this.currentWallet) return;
      
      try {
        // Get address (placeholder - needs Ark SDK integration)
        this.walletAddress = await arkCore.getAddress(this.currentWallet, 'placeholder');
        
        // Generate QR code
        const canvas = this.$refs.qrCanvas;
        if (canvas) {
          await arkCore.generateQRCode(canvas, this.walletAddress);
        }
        
        // Get balance
        const balance = await arkCore.getBalance(this.currentWallet.id);
        this.currentWallet.balance = balance;
        
        // Load transactions
        await this.loadTransactions();
        
        // Load swaps
        await this.loadSwaps();
      } catch (error) {
        console.error('Refresh error:', error);
      }
    },

    /**
     * Refresh balance manually
     */
    async refreshBalance() {
      this.refreshing = true;
      try {
        await this.refreshWalletData();
        this.$q.notify({
          type: 'positive',
          message: 'Balance refreshed',
          icon: 'refresh'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to refresh balance'
        });
      } finally {
        this.refreshing = false;
      }
    },

    /**
     * Load transactions
     */
    async loadTransactions() {
      if (!this.currentWallet) return;
      
      try {
        const response = await LNbits.api.request(
          'GET',
          `/ark_wallet/api/wallets/${this.currentWallet.id}/transactions`,
          this.g.user.wallets[0].inkey
        );
        this.transactions = response.data || [];
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    },

    /**
     * Load swaps
     */
    async loadSwaps() {
      if (!this.currentWallet) return;
      
      try {
        const response = await LNbits.api.request(
          'GET',
          `/ark_wallet/api/wallets/${this.currentWallet.id}/swaps`,
          this.g.user.wallets[0].inkey
        );
        this.swaps = response.data || [];
      } catch (error) {
        console.error('Failed to load swaps:', error);
      }
    },

    /**
     * Send Ark transaction
     */
    async sendArk() {
      if (!this.currentWallet) return;
      
      this.sending = true;
      try {
        const tx = await arkCore.sendArk(
          this.currentWallet.id,
          this.sendForm.address,
          this.sendForm.amount,
          this.sendForm.memo
        );
        
        this.$q.notify({
          type: 'positive',
          message: 'Transaction sent!',
          caption: `TX ID: ${tx.id}`,
          icon: 'send'
        });
        
        // Reset form
        this.sendForm = { address: '', amount: 0, memo: '' };
        
        // Refresh data
        await this.refreshWalletData();
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Transaction failed',
          caption: error.message
        });
      } finally {
        this.sending = false;
      }
    },

    /**
     * Swap In (Lightning -> Ark)
     */
    async swapIn() {
      if (!this.currentWallet) return;
      
      this.swappingIn = true;
      try {
        const swap = await arkCore.createBoltzSwap(
          this.currentWallet.id,
          'submarine',
          0, // Amount extracted from invoice
          this.swapInForm.invoice
        );
        
        this.$q.notify({
          type: 'positive',
          message: 'Swap initiated!',
          caption: 'Processing Lightning → Ark swap',
          icon: 'swap_horiz'
        });
        
        // Reset form
        this.swapInForm.invoice = '';
        
        // Refresh data
        await this.loadSwaps();
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Swap failed',
          caption: error.message
        });
      } finally {
        this.swappingIn = false;
      }
    },

    /**
     * Swap Out (Ark -> Lightning)
     */
    async swapOut() {
      if (!this.currentWallet) return;
      
      this.swappingOut = true;
      try {
        const swap = await arkCore.createBoltzSwap(
          this.currentWallet.id,
          'reverse',
          this.swapOutForm.amount,
          null,
          this.swapOutForm.address
        );
        
        this.$q.notify({
          type: 'positive',
          message: 'Swap initiated!',
          caption: 'Processing Ark → Lightning swap',
          icon: 'swap_horiz'
        });
        
        // Reset form
        this.swapOutForm = { amount: 100000, address: '' };
        
        // Refresh data
        await this.loadSwaps();
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Swap failed',
          caption: error.message
        });
      } finally {
        this.swappingOut = false;
      }
    },

    /**
     * Copy address to clipboard
     */
    async copyAddress() {
      try {
        await navigator.clipboard.writeText(this.walletAddress);
        this.$q.notify({
          type: 'positive',
          message: 'Address copied!',
          icon: 'content_copy'
        });
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to copy address'
        });
      }
    },

    /**
     * Show transaction details
     */
    showTransactionDetails(tx) {
      this.$q.dialog({
        title: 'Transaction Details',
        message: `
          <div class="q-pa-md">
            <p><strong>Type:</strong> ${tx.tx_type}</p>
            <p><strong>Amount:</strong> ${this.formatBalance(tx.amount)} sats</p>
            <p><strong>Status:</strong> ${tx.status}</p>
            <p><strong>Address:</strong> ${tx.address || 'N/A'}</p>
            <p><strong>TX ID:</strong> ${tx.txid || 'Pending'}</p>
            <p><strong>Date:</strong> ${this.formatDate(tx.created_at)}</p>
            ${tx.memo ? `<p><strong>Memo:</strong> ${tx.memo}</p>` : ''}
          </div>
        `,
        html: true
      });
    },

    /**
     * Complete mnemonic backup
     */
    completeMnemonicBackup() {
      this.showMnemonicDialog = false;
      this.$q.notify({
        type: 'positive',
        message: 'Wallet created successfully!',
        caption: 'Make sure you saved your mnemonic phrase',
        icon: 'check_circle'
      });
    },

    /**
     * Confirm delete wallet
     */
    async confirmDeleteWallet() {
      try {
        const confirmed = await this.$q.dialog({
          title: 'Delete Wallet',
          message: 'Are you sure you want to delete this wallet? This action cannot be undone. Make sure you have backed up your mnemonic phrase!',
          cancel: true,
          persistent: true,
          color: 'negative'
        });

        if (confirmed) {
          await this.deleteWallet();
        }
      } catch (error) {
        // User cancelled
      }
    },

    /**
     * Delete wallet
     */
    async deleteWallet() {
      if (!this.currentWallet) return;
      
      try {
        await LNbits.api.request(
          'DELETE',
          `/ark_wallet/api/wallets/${this.currentWallet.id}`,
          this.g.user.wallets[0].adminkey
        );
        
        this.$q.notify({
          type: 'positive',
          message: 'Wallet deleted',
          icon: 'delete'
        });
        
        // Clear current wallet
        this.currentWallet = null;
        localStorage.removeItem('ark_last_wallet');
        
        // Reload wallets
        await this.loadWallets();
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to delete wallet',
          caption: error.message
        });
      }
    },

    /**
     * Helper: Format balance
     */
    formatBalance(sats) {
      return new Intl.NumberFormat('en-US').format(sats);
    },

    /**
     * Helper: Format date
     */
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString();
    },

    /**
     * Helper: Get transaction icon
     */
    getTxIcon(type) {
      const icons = {
        send: 'send',
        receive: 'call_received',
        onboard: 'upload',
        offboard: 'download',
        swap_in: 'swap_horiz',
        swap_out: 'swap_horiz'
      };
      return icons[type] || 'receipt';
    },

    /**
     * Helper: Get transaction color
     */
    getTxColor(type) {
      const colors = {
        send: 'red',
        receive: 'green',
        onboard: 'blue',
        offboard: 'orange',
        swap_in: 'purple',
        swap_out: 'purple'
      };
      return colors[type] || 'grey';
    },

    /**
     * Helper: Get status color
     */
    getStatusColor(status) {
      const colors = {
        pending: 'orange',
        confirmed: 'green',
        completed: 'green',
        failed: 'red',
        refunded: 'orange'
      };
      return colors[status] || 'grey';
    },

    /**
     * Helper: Get network color
     */
    getNetworkColor(network) {
      const colors = {
        mainnet: 'orange',
        testnet: 'blue',
        mutinynet: 'purple'
      };
      return colors[network] || 'grey';
    }
  },
  beforeDestroy() {
    // Stop auto-refresh when component is destroyed
    arkCore.stopRefresh();
  }
});

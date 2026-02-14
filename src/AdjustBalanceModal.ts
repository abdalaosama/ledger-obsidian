import { LedgerModifier } from './file-interface';
import LedgerPlugin from './main';
import { Modal, Notice, TFile, DropdownComponent, TextComponent } from 'obsidian';
import { makeDailyAccountBalanceChangeMap, makeDailyBalanceMap, findChildAccounts } from './balance-utils';

/**
 * AdjustBalanceModal allows users to reconcile account balances by entering the actual
 * balance from their bank or statement, and automatically generates a balance adjustment
 * transaction to correct any discrepancies.
 */
export class AdjustBalanceModal extends Modal {
    private readonly plugin: LedgerPlugin;
    private selectedAccount: string = '';
    private actualBalance: number = 0;
    private accountDropdown!: DropdownComponent;
    private actualBalanceInput!: TextComponent;
    private bookBalanceEl!: HTMLElement;
    private differenceEl!: HTMLElement;

    constructor(plugin: LedgerPlugin) {
        super(plugin.app);
        this.plugin = plugin;
    }

    public onOpen = (): void => {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('adjust-balance-modal');

        // Title
        contentEl.createEl('h2', { text: 'Start Reconciliation (Adjust Balance)' });

        // Check if txCache is loaded
        if (!this.plugin.txCache || !this.plugin.txCache.transactions) {
            contentEl.createEl('p', { text: 'Ledger data not loaded, please check the ledger file path settings' });
            return;
        }

        // Get Assets and Liabilities accounts
        const assetsAndLiabilities = this.plugin.txCache.accounts.filter((account) =>
            account.startsWith(this.plugin.settings.assetAccountsPrefix) ||
            account.startsWith(this.plugin.settings.liabilityAccountsPrefix)
        );

        if (assetsAndLiabilities.length === 0) {
            contentEl.createEl('p', { text: 'No assets or liabilities accounts found' });
            return;
        }

        // Account selection
        const accountContainer = contentEl.createDiv({ cls: 'adjust-balance-field' });
        accountContainer.createEl('label', { text: 'Select Account:' });
        this.accountDropdown = new DropdownComponent(accountContainer);

        // Add placeholder option
        this.accountDropdown.addOption('', '-- Please Select Account --');

        // Add accounts to dropdown
        assetsAndLiabilities.forEach((account) => {
            this.accountDropdown.addOption(account, account);
        });

        this.accountDropdown.onChange((value) => {
            this.selectedAccount = value;
            this.updateBookBalance();
            this.updateDifference();
        });

        // Book balance display
        const bookBalanceContainer = contentEl.createDiv({ cls: 'adjust-balance-field' });
        bookBalanceContainer.createEl('label', { text: 'Book Balance:' });
        this.bookBalanceEl = bookBalanceContainer.createDiv({ cls: 'adjust-balance-readonly' });
        this.bookBalanceEl.setText('Please select an account first');

        // Actual balance input
        const actualBalanceContainer = contentEl.createDiv({ cls: 'adjust-balance-field' });
        actualBalanceContainer.createEl('label', { text: 'Actual Balance:' });
        this.actualBalanceInput = new TextComponent(actualBalanceContainer);
        this.actualBalanceInput.setPlaceholder('Enter actual balance (e.g.: 1000.00)');
        this.actualBalanceInput.onChange((value) => {
            const parsed = parseFloat(value);
            this.actualBalance = isNaN(parsed) ? 0 : parsed;
            this.updateDifference();
        });

        // Difference preview
        const differenceContainer = contentEl.createDiv({ cls: 'adjust-balance-field' });
        differenceContainer.createEl('label', { text: 'Difference Preview:' });
        this.differenceEl = differenceContainer.createDiv({ cls: 'adjust-balance-difference' });
        this.differenceEl.setText('--');

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'adjust-balance-buttons' });

        const confirmButton = buttonContainer.createEl('button', {
            text: 'Confirm',
            cls: 'mod-cta'
        });
        confirmButton.addEventListener('click', () => this.handleSubmit());

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => this.close());

        // Add some styles
        this.addStyles();
    };

    /**
     * Calculate and display the current book balance for the selected account
     */
    private updateBookBalance = (): void => {
        if (!this.selectedAccount) {
            this.bookBalanceEl.setText('Please select an account first');
            return;
        }

        try {
            const changeMap = makeDailyAccountBalanceChangeMap(
                this.plugin.txCache.transactions
            );
            const balanceMap = makeDailyBalanceMap(
                this.plugin.txCache.accounts,
                changeMap,
                this.plugin.txCache.firstDate,
                window.moment()
            );

            // Get the most recent balance
            const today = window.moment().format('YYYY-MM-DD');
            const accountBalances = balanceMap.get(today);

            if (!accountBalances) {
                this.bookBalanceEl.setText(`Book: ${this.plugin.settings.currencySymbol}0.00`);
                return;
            }

            // Sum up the balance for the account and its children
            const allAccounts = this.plugin.txCache.accounts;
            const accounts = [...findChildAccounts(this.selectedAccount, allAccounts), this.selectedAccount];
            const balance = accounts.reduce(
                (prev, currentAccount) => (accountBalances.get(currentAccount) || 0) + prev,
                0
            );

            this.bookBalanceEl.setText(
                `Book: ${this.plugin.settings.currencySymbol}${balance.toFixed(2)}`
            );
        } catch (error) {
            this.bookBalanceEl.setText('Error calculating balance');
        }
    };

    /**
     * Calculate and display the difference between actual and book balance
     */
    private updateDifference = (): void => {
        if (!this.selectedAccount || !this.actualBalanceInput.getValue()) {
            this.differenceEl.setText('--');
            return;
        }

        try {
            const changeMap = makeDailyAccountBalanceChangeMap(
                this.plugin.txCache.transactions
            );
            const balanceMap = makeDailyBalanceMap(
                this.plugin.txCache.accounts,
                changeMap,
                this.plugin.txCache.firstDate,
                window.moment()
            );

            const today = window.moment().format('YYYY-MM-DD');
            const accountBalances = balanceMap.get(today);
            const allAccounts = this.plugin.txCache.accounts;
            const accounts = [...findChildAccounts(this.selectedAccount, allAccounts), this.selectedAccount];
            const bookBalance = accountBalances
                ? accounts.reduce(
                    (prev, currentAccount) => (accountBalances.get(currentAccount) || 0) + prev,
                    0
                )
                : 0;

            const diff = this.actualBalance - bookBalance;
            const sign = diff >= 0 ? '+' : '';

            this.differenceEl.setText(
                `To Adjust: ${sign}${this.plugin.settings.currencySymbol}${diff.toFixed(2)}`
            );

            // Color code the difference
            if (diff > 0) {
                this.differenceEl.style.color = 'var(--text-success)';
            } else if (diff < 0) {
                this.differenceEl.style.color = 'var(--text-error)';
            } else {
                this.differenceEl.style.color = 'var(--text-muted)';
            }
        } catch (error) {
            this.differenceEl.setText('Error calculating difference');
        }
    };

    /**
     * Handle the submission of the balance adjustment
     */
    private handleSubmit = async (): Promise<void> => {
        if (!this.selectedAccount) {
            new Notice('Please select an account');
            return;
        }

        if (!this.actualBalanceInput.getValue()) {
            new Notice('Please enter actual balance');
            return;
        }

        try {
            // Calculate the difference
            const changeMap = makeDailyAccountBalanceChangeMap(
                this.plugin.txCache.transactions
            );
            const balanceMap = makeDailyBalanceMap(
                this.plugin.txCache.accounts,
                changeMap,
                this.plugin.txCache.firstDate,
                window.moment()
            );

            const today = window.moment().format('YYYY-MM-DD');
            const accountBalances = balanceMap.get(today);
            const allAccounts = this.plugin.txCache.accounts;
            const accounts = [...findChildAccounts(this.selectedAccount, allAccounts), this.selectedAccount];
            const bookBalance = accountBalances
                ? accounts.reduce(
                    (prev, currentAccount) => (accountBalances.get(currentAccount) || 0) + prev,
                    0
                )
                : 0;

            const diff = this.actualBalance - bookBalance;

            if (diff === 0) {
                new Notice('Book balance matches actual balance, no adjustment needed');
                this.close();
                return;
            }

            // Generate ledger transaction
            const dateStr = window.moment().format('YYYY-MM-DD');
            const diffStr = diff >= 0
                ? `${this.plugin.settings.currencySymbol}${diff.toFixed(2)}`
                : `-${this.plugin.settings.currencySymbol}${Math.abs(diff).toFixed(2)}`;

            const ledgerText = `\n${dateStr} * Balance Adjustment
    ${this.selectedAccount}      ${diffStr}
    Equity:Balance Adjustment
`;

            // Get the ledger file
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(
                this.plugin.settings.ledgerFile
            );

            if (!abstractFile || !(abstractFile instanceof TFile)) {
                new Notice('Ledger file not found');
                return;
            }

            const ledgerFile = abstractFile as TFile;

            // Append to the file
            const currentContent = await this.plugin.app.vault.read(ledgerFile);
            const newContent = currentContent + ledgerText;
            await this.plugin.app.vault.modify(ledgerFile, newContent);

            // Refresh the transaction cache
            await (this.plugin as any).updateTransactionCache();

            new Notice('Balance adjusted successfully!');
            this.close();
        } catch (error) {
            new Notice('Balance adjustment failed');
        }
    };

    /**
     * Add custom styles to the modal
     */
    private addStyles = (): void => {
        const style = document.createElement('style');
        style.textContent = `
            .adjust-balance-modal {
                padding: 20px;
            }
            .adjust-balance-field {
                margin-bottom: 16px;
            }
            .adjust-balance-field label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
            }
            .adjust-balance-readonly {
                padding: 8px;
                background: var(--background-secondary);
                border-radius: 4px;
                color: var(--text-muted);
            }
            .adjust-balance-difference {
                padding: 8px;
                font-weight: 600;
                font-size: 14px;
            }
            .adjust-balance-buttons {
                display: flex;
                gap: 8px;
                margin-top: 24px;
                justify-content: flex-end;
            }
        `;
        this.contentEl.appendChild(style);
    };

    public onClose = (): void => {
        const { contentEl } = this;
        contentEl.empty();
    };
}

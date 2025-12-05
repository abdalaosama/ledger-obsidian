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
        contentEl.createEl('h2', { text: '开始对账 (修正余额)' });

        // Check if txCache is loaded
        if (!this.plugin.txCache || !this.plugin.txCache.transactions) {
            contentEl.createEl('p', { text: '账本数据未加载，请检查账本文件路径设置' });
            return;
        }

        // Get Assets and Liabilities accounts
        const assetsAndLiabilities = this.plugin.txCache.accounts.filter((account) =>
            account.startsWith(this.plugin.settings.assetAccountsPrefix) ||
            account.startsWith(this.plugin.settings.liabilityAccountsPrefix)
        );

        if (assetsAndLiabilities.length === 0) {
            contentEl.createEl('p', { text: '未找到资产或负债账户' });
            return;
        }

        // Account selection
        const accountContainer = contentEl.createDiv({ cls: 'adjust-balance-field' });
        accountContainer.createEl('label', { text: '选择账户:' });
        this.accountDropdown = new DropdownComponent(accountContainer);

        // Add placeholder option
        this.accountDropdown.addOption('', '-- 请选择账户 --');

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
        bookBalanceContainer.createEl('label', { text: '账面余额:' });
        this.bookBalanceEl = bookBalanceContainer.createDiv({ cls: 'adjust-balance-readonly' });
        this.bookBalanceEl.setText('请先选择账户');

        // Actual balance input
        const actualBalanceContainer = contentEl.createDiv({ cls: 'adjust-balance-field' });
        actualBalanceContainer.createEl('label', { text: '实际余额:' });
        this.actualBalanceInput = new TextComponent(actualBalanceContainer);
        this.actualBalanceInput.setPlaceholder('输入实际余额 (例如: 1000.00)');
        this.actualBalanceInput.onChange((value) => {
            const parsed = parseFloat(value);
            this.actualBalance = isNaN(parsed) ? 0 : parsed;
            this.updateDifference();
        });

        // Difference preview
        const differenceContainer = contentEl.createDiv({ cls: 'adjust-balance-field' });
        differenceContainer.createEl('label', { text: '差额预览:' });
        this.differenceEl = differenceContainer.createDiv({ cls: 'adjust-balance-difference' });
        this.differenceEl.setText('--');

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'adjust-balance-buttons' });

        const confirmButton = buttonContainer.createEl('button', {
            text: '确认写入',
            cls: 'mod-cta'
        });
        confirmButton.addEventListener('click', () => this.handleSubmit());

        const cancelButton = buttonContainer.createEl('button', { text: '取消' });
        cancelButton.addEventListener('click', () => this.close());

        // Add some styles
        this.addStyles();
    };

    /**
     * Calculate and display the current book balance for the selected account
     */
    private updateBookBalance = (): void => {
        if (!this.selectedAccount) {
            this.bookBalanceEl.setText('请先选择账户');
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
                this.bookBalanceEl.setText(`账面: ${this.plugin.settings.currencySymbol}0.00`);
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
                `账面: ${this.plugin.settings.currencySymbol}${balance.toFixed(2)}`
            );
        } catch (error) {
            this.bookBalanceEl.setText('计算余额时出错');
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
                `需修正: ${sign}${this.plugin.settings.currencySymbol}${diff.toFixed(2)}`
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
            this.differenceEl.setText('计算差额时出错');
        }
    };

    /**
     * Handle the submission of the balance adjustment
     */
    private handleSubmit = async (): Promise<void> => {
        if (!this.selectedAccount) {
            new Notice('请选择一个账户');
            return;
        }

        if (!this.actualBalanceInput.getValue()) {
            new Notice('请输入实际余额');
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
                new Notice('账面与实际余额一致，无需修正');
                this.close();
                return;
            }

            // Generate ledger transaction
            const dateStr = window.moment().format('YYYY-MM-DD');
            const diffStr = diff >= 0
                ? `${this.plugin.settings.currencySymbol}${diff.toFixed(2)}`
                : `-${this.plugin.settings.currencySymbol}${Math.abs(diff).toFixed(2)}`;

            const ledgerText = `\n${dateStr} * 余额修正
    ${this.selectedAccount}      ${diffStr}
    权益:余额调整
`;

            // Get the ledger file
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(
                this.plugin.settings.ledgerFile
            );

            if (!abstractFile || !(abstractFile instanceof TFile)) {
                new Notice('账本文件未找到');
                return;
            }

            const ledgerFile = abstractFile as TFile;

            // Append to the file
            const currentContent = await this.plugin.app.vault.read(ledgerFile);
            const newContent = currentContent + ledgerText;
            await this.plugin.app.vault.modify(ledgerFile, newContent);

            // Refresh the transaction cache
            await (this.plugin as any).updateTransactionCache();

            new Notice('余额已修正！');
            this.close();
        } catch (error) {
            new Notice('修正余额失败');
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

import { LedgerModifier } from './file-interface';
import LedgerPlugin from './main';
import { EnhancedTransaction } from './parser';
import {
    formatTransaction,
    hasUnreconciledLines,
    markAsReconciled,
} from './transaction-utils';
import { ReconcileTransactions } from './ui/ReconcileTransactions';
import { Modal, Notice, TFile } from 'obsidian';
import React from 'react';
import ReactDOM from 'react-dom';

export class ReconcileModal extends Modal {
    private readonly plugin: LedgerPlugin;

    constructor(plugin: LedgerPlugin) {
        super(plugin.app);
        this.plugin = plugin;
    }

    public onOpen = async (): Promise<void> => {
        // Check if txCache is loaded
        if (!this.plugin.txCache || !this.plugin.txCache.transactions) {
            new Notice('Ledger data not loaded, reloading...');
            try {
                // Try to reload
                await (this.plugin as any).updateTransactionCache();

                // Check again
                if (!this.plugin.txCache || !this.plugin.txCache.transactions) {
                    new Notice('Unable to load ledger data, please check the ledger file path settings');
                    this.close();
                    return;
                }
            } catch (error) {
                console.error('Failed to load ledger:', error);
                new Notice('Failed to load ledger, please check the console');
                this.close();
                return;
            }
        }

        const unreconciledTxs = this.getUnreconciledTransactions();

        ReactDOM.render(
            React.createElement(ReconcileTransactions, {
                transactions: unreconciledTxs,
                currencySymbol: this.plugin.settings.currencySymbol,
                onReconcile: this.handleReconcile,
                onClose: () => this.close(),
            }),
            this.contentEl,
        );
    };

    /**
     * getUnreconciledTransactions filters all transactions to find those
     * that have at least one unreconciled expense line.
     */
    private getUnreconciledTransactions = (): EnhancedTransaction[] => {
        return this.plugin.txCache.transactions.filter((tx) =>
            hasUnreconciledLines(tx),
        );
    };

    /**
     * handleReconcile processes the selected transactions and marks them as reconciled.
     * It modifies the ledger file by updating each transaction with the '*' reconcile mark.
     */
    private handleReconcile = async (
        selectedTxs: EnhancedTransaction[],
    ): Promise<void> => {
        if (selectedTxs.length === 0) {
            return;
        }

        try {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(
                this.plugin.settings.ledgerFile,
            );

            if (!abstractFile || !(abstractFile instanceof TFile)) {
                new Notice('Ledger file not found');
                return;
            }

            const ledgerFile = abstractFile as TFile;
            const modifier = new LedgerModifier(this.plugin, ledgerFile);

            // Read the file once
            const fileContents = await this.plugin.app.vault.cachedRead(ledgerFile);
            let modifiedContent = fileContents;

            // Sort transactions from last to first to avoid line number changes
            const sortedTxs = [...selectedTxs].sort(
                (a, b) => b.block.firstLine - a.block.firstLine,
            );

            // Process each transaction
            for (const tx of sortedTxs) {
                const reconciledTx = markAsReconciled(tx);
                const serialized = formatTransaction(
                    reconciledTx,
                    this.plugin.settings.currencySymbol,
                );

                const lines = modifiedContent.split('\n');
                const newLines =
                    lines.slice(0, tx.block.firstLine).join('\n') +
                    serialized +
                    '\n' +
                    lines.slice(tx.block.lastLine + 1).join('\n');
                modifiedContent = newLines;
            }

            // Write back to file once
            await this.plugin.app.vault.modify(ledgerFile, modifiedContent);

            // Refresh the transaction cache
            await (this.plugin as any).updateTransactionCache();

            // Show success message
            new Notice(
                `Statement reconciliation completed, total ${selectedTxs.length} transactions`,
            );

            this.close();
        } catch (error) {
            console.error('Reconciliation failed:', error);
            new Notice('Statement reconciliation failed, please check the console');
        }
    };

    public onClose = (): void => {
        ReactDOM.unmountComponentAtNode(this.contentEl);
        this.contentEl.empty();
    };
}

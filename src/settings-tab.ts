import LedgerPlugin from './main';
import { PluginSettingTab, Setting } from 'obsidian';

export class SettingsTab extends PluginSettingTab {
  private readonly plugin: LedgerPlugin;

  constructor(plugin: LedgerPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Ledger Plugin - Settings' });

    new Setting(containerEl)
      .setName('Currency Symbol')
      .setDesc('Prefix for all transaction amounts')
      .addText((text) => {
        text.setPlaceholder('$').setValue(this.plugin.settings.currencySymbol);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.currencySymbol = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName('Dashboard Title')
      .setDesc('Title displayed at the top of the Ledger dashboard')
      .addText((text) => {
        text.setValue(this.plugin.settings.dashboardTitle);
        text.inputEl.onblur = async (e: FocusEvent) => {
          const newValue = (e.target as HTMLInputElement).value;
          this.plugin.settings.dashboardTitle = newValue;
          await this.plugin.saveData(this.plugin.settings);
        };
      });

    containerEl.createEl('h3', 'Chart Settings');

    new Setting(containerEl)
      .setName('Adaptive Y-axis')
      .setDesc('Automatically adjust Y-axis range to magnify small changes for easier trend observation')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.chartAdaptiveYAxis);
        toggle.onChange(async (value) => {
          this.plugin.settings.chartAdaptiveYAxis = value;
          await this.plugin.saveData(this.plugin.settings);
        });
      });

    new Setting(containerEl)
      .setName('Default Chart Mode')
      .setDesc('Select the default chart type displayed on the account page')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('balance', 'Account Balance')
          .addOption('pnl', 'Profit & Loss')
          .setValue(this.plugin.settings.defaultChartMode)
          .onChange(async (value) => {
            this.plugin.settings.defaultChartMode = value as 'balance' | 'pnl';
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName('Ledger document')
      .setDesc(
        'The path to the Ledger file in the repository. Note: If you are using Obsidian Sync, you must enable "Sync all other types".',
      )
      .addText((text) => {
        text
          .setValue(this.plugin.settings.ledgerFile)
          .setPlaceholder('transactions.ledger');
        text.inputEl.onblur = (e: FocusEvent) => {
          const target = e.target as HTMLInputElement;
          const newValue = target.value;

          if (newValue.endsWith('.ledger')) {
            target.setCustomValidity('');
            this.plugin.settings.ledgerFile = newValue;
            this.plugin.saveData(this.plugin.settings);
          } else {
            target.setCustomValidity('File must end with .ledger');
          }
          target.reportValidity();
        };
      });

    containerEl.createEl('h3', 'Transaction Account Prefixes');

    new Setting(containerEl)
      .setName('Asset Accounts')
      .setDesc('Prefix for asset accounts')
      .addText((text) => {
        text.setValue(this.plugin.settings.assetAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.assetAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName('Expense Accounts')
      .setDesc('Prefix for expense accounts')
      .addText((text) => {
        text.setValue(this.plugin.settings.expenseAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.expenseAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName('Income Accounts')
      .setDesc('Prefix for income accounts')
      .addText((text) => {
        text.setValue(this.plugin.settings.incomeAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.incomeAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName('Liability Accounts')
      .setDesc('Prefix for liability accounts')
      .addText((text) => {
        text.setValue(this.plugin.settings.liabilityAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.liabilityAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

  }
}



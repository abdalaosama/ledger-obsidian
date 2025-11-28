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

    containerEl.createEl('h2', { text: 'Ledger 插件 - 设置' });

    new Setting(containerEl)
      .setName('货币符号')
      .setDesc('所有交易金额的前缀')
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
      .setName('面板标题')
      .setDesc('Ledger 面板顶部显示的标题')
      .addText((text) => {
        text.setValue(this.plugin.settings.dashboardTitle);
        text.inputEl.onblur = async (e: FocusEvent) => {
          const newValue = (e.target as HTMLInputElement).value;
          this.plugin.settings.dashboardTitle = newValue;
          await this.plugin.saveData(this.plugin.settings);
        };
      });

    containerEl.createEl('h3', '图表设置');

    new Setting(containerEl)
      .setName('自适应Y轴')
      .setDesc('自动调整Y轴范围以放大显示小变化，更易观察趋势')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.chartAdaptiveYAxis);
        toggle.onChange(async (value) => {
          this.plugin.settings.chartAdaptiveYAxis = value;
          await this.plugin.saveData(this.plugin.settings);
        });
      });

    new Setting(containerEl)
      .setName('默认图表模式')
      .setDesc('选择账户页面默认显示的图表类型')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('balance', '账户余额')
          .addOption('pnl', '盈亏')
          .setValue(this.plugin.settings.defaultChartMode)
          .onChange(async (value) => {
            this.plugin.settings.defaultChartMode = value as 'balance' | 'pnl';
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName('Ledger 文件')
      .setDesc(
        'Ledger 文件在仓库中的路径。注意：如果您使用 Obsidian Sync，必须启用“同步所有其他类型”。',
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
            target.setCustomValidity('文件必须以 .ledger 结尾');
          }
          target.reportValidity();
        };
      });

    containerEl.createEl('h3', '交易账户前缀');

    new Setting(containerEl)
      .setName('资产账户')
      .setDesc('资产账户的前缀')
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
      .setName('支出账户')
      .setDesc('支出账户的前缀')
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
      .setName('收入账户')
      .setDesc('收入账户的前缀')
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
      .setName('负债账户')
      .setDesc('负债账户的前缀')
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



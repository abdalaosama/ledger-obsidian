const defaultSettings: ISettings = {
  currencySymbol: '$',
  ledgerFile: 'transactions.ledger',

  assetAccountsPrefix: 'Assets',
  expenseAccountsPrefix: 'Expenses',
  incomeAccountsPrefix: 'Income',
  liabilityAccountsPrefix: 'Liabilities',
  dashboardTitle: 'Ledger Dashboard',
  chartAdaptiveYAxis: true,
  defaultChartMode: 'balance',
};

export interface ISettings {
  currencySymbol: string;
  ledgerFile: string;

  assetAccountsPrefix: string;
  expenseAccountsPrefix: string;
  incomeAccountsPrefix: string;
  liabilityAccountsPrefix: string;
  dashboardTitle: string;
  chartAdaptiveYAxis: boolean;
  defaultChartMode: 'balance' | 'pnl';
}

export const settingsWithDefaults = (
  settings: Partial<ISettings>,
): ISettings => ({
  ...defaultSettings,
  ...settings,
});

# Ledger for Obsidian

> **Professional Plain Text Accounting Plugin for Obsidian**  
> Store your financial data securely in your own vault, protect your privacy, and maintain complete control.

[![GitHub release](https://img.shields.io/github/v/release/Elo-Mario/ledger-obsidian)](https://github.com/Elo-Mario/ledger-obsidian/releases)
[![License](https://img.shields.io/github/license/Elo-Mario/ledger-obsidian)](LICENSE)

Easily manage your personal finances in Obsidian! All data is stored in plain text format and integrates seamlessly with any tool that supports [Ledger CLI](https://www.ledger-cli.org). Say goodbye to online accounting websites that sell user data—store your financial information securely in your Obsidian vault.

---

## ✨ Highlights - New Features (v0.4.8)

### 📊 **Interactive Financial Reports**
A brand new visualization system to help you understand your finances comprehensively:

- **Panoramic Cash Flow Chart (Sankey)**  
  Intuitive visualization of the complete cash flow path from **Income → Assets → Expenses**, clearly showing where every penny comes from and goes
  
- **Asset/Liability Structure Chart (Treemap)**  
  Dual treemap side-by-side showing assets (green) and liabilities (red) in detail for a clear view of your financial structure
  
- **Trend Analysis Chart**  
  Track income/expense trends and cumulative net asset changes at daily/weekly/monthly scales
  
- **Perfect Theme Integration**  
  Charts automatically adapt to Obsidian's light/dark theme, seamlessly blending with your workspace

> 💡 **Tip**: Click the "Financial Report" button on the dashboard or search for "Financial Report" in the command palette

### ⚖️ **Smart Reconciliation Wizard**
New "Start Reconciliation" feature to easily correct account balances:

- **One-click Balance Correction**: Input the actual balance, and the system automatically calculates and generates correcting transactions
- **Real-time Preview**: Dynamic display of the difference between book balance and actual balance
- **Auto-save**: No manual editing of Ledger files needed—just click confirm to complete the correction

> 💡 **Use Case**: Found a discrepancy between your book balance and your bank app? Use the "Start Reconciliation" feature to easily fix it!

---

## 🎯 Core Features

### 💰 Quick Expense Recording
- **Mobile Friendly**: Works seamlessly with Obsidian mobile app for on-the-go expense tracking
- **Smart Suggestions**: Auto-suggests historical accounts and expense categories to speed up input
- **Protocol Support**: Supports Obsidian protocol `obsidian://ledger` for creating desktop/home screen shortcuts

### ✅ Statement Reconciliation
- Quick view of unreconciled transactions
- Batch reconcile multiple transactions with one click
- Automatically add `*` markers to transaction dates

### 📈 Data Visualization
- Account balance charts
- Income/expense trend analysis
- Net worth change tracking
- Interactive hover tooltips

---

## 📥 Installation

### Method 1: Install from Obsidian Community Plugins (Recommended)
1. Open **Settings → Community Plugins**
2. Search for **"Ledger"**
3. Click **Install** → **Enable**

### Method 2: Manual Installation
1. Download the latest version from [GitHub Releases](https://github.com/Elo-Mario/ledger-obsidian/releases)
2. Extract `main.js` and `manifest.json` to `.obsidian/plugins/ledger-obsidian/`
3. Reload Obsidian and enable the plugin

---

## ⚙️ Configuration Guide

### Required Settings

#### 1. Enable Chart Functionality
You **must enable "Enable Charts"** in plugin settings to view financial reports.

#### 2. Set Ledger File Path
Specify the path to your main Ledger file (e.g., `finance/transactions.ledger`)

### Ledger File Format

This plugin supports standard Ledger format with full internationalization support:

```ledger
; Alias definitions (optional)
alias a=Assets
alias e=Expenses
alias i=Income

; Reconciled transaction (* marker after date)
2025-01-01 * Salary Income
    Assets:Bank:Checking             ¥10,000.00
    Income:Salary                   -¥10,000.00

; Unreconciled transaction (no * marker)
2025-01-02 Supermarket Shopping
    Expenses:Food:Groceries         ¥123.45
    Assets:Bank:Checking           -¥123.45

2025-01-03 * Restaurant
    Expenses:Dining:Lunch           ¥45.00
    Assets:Alipay                  -¥45.00
```

**Format Guidelines:**
- ✅ Full support for account names in any language
- ✅ Use `¥`, `$`, `€` and other currency symbols for amounts
- ✅ Use **at least 2 spaces** between account name and amount
- ✅ `*` after the date indicates a reconciled transaction
- ✅ Lines starting with `;` are comments

---

## 📖 Usage Guide

### Available Commands

Access the following commands from Obsidian's command palette (`Ctrl/Cmd + P`):

| Command | Description | v0.4.8 |
|---------|-------------|--------|
| **Log Transaction** | Quickly add a new transaction | |
| **Open Ledger Dashboard** | View account balances and transaction history | |
| **Financial Report** | View visualizations and detailed analysis | ⭐ Enhanced |
| **Start Reconciliation** | Correct discrepancies between book and actual balances | 🆕 New |
| **Statement Reconciliation** | Batch mark transactions as reconciled | |

### Sidebar Quick Buttons

In the Ledger dashboard sidebar, you'll find these quick-access buttons:
- **Statement Reconciliation**: Open reconciliation dialog
- **Start Reconciliation**: Open balance adjustment wizard
- **Financial Report**: Open visualization reports

---

## 📸 Feature Showcase

### 💰 Financial Report
![Financial Report Overview](./resources/screenshots/financial-report-overview.png)
> All-in-one visualization: Sankey chart for cash flow, treemap for structure, trend chart for changes

### ⚖️ Start Reconciliation
![Start Reconciliation](./resources/screenshots/adjust-balance-modal.png)
> Input actual balance, automatically calculate difference and generate correcting transaction

### ✅ Statement Reconciliation
![Statement Reconciliation](./resources/screenshots/reconcile-transactions.png)
> Batch reconcile transactions, add reconciliation markers with one click

### 📊 Ledger Dashboard
![Ledger Dashboard](https://raw.githubusercontent.com/Elo-Mario/ledger-obsidian/main/resources/screenshots/ledger-dashboard.png)
> Clear account balance and transaction list view

### ➕ Add Transaction
![Add Transaction](https://raw.githubusercontent.com/Elo-Mario/ledger-obsidian/main/resources/screenshots/add-to-ledger.png)
> Quick expense form with smart suggestions

### 📱 Mobile Support
![Mobile](https://raw.githubusercontent.com/Elo-Mario/ledger-obsidian/main/resources/screenshots/mobile-add-expense.png)
> Easy expense tracking on your phone

---

## 🆕 Changelog

### v0.4.8 (2025-12-05)

#### 🎉 New Features
- **Start Reconciliation Feature**:
  - ⚖️ Brand new balance adjustment wizard
  - 🔢 Automatically calculate difference between book and actual balance
  - ✏️ One-click generate correcting transaction and save to Ledger file
  - 🎨 Real-time difference preview with green for positive, red for negative

#### 📊 Enhanced Features
- **Financial Report Improvements**:
  - 🌈 Improved chart color contrast for clearer text
  - 🎨 Optimized UI details and layout
  - 🔧 Faster theme switching response

#### 🐛 Bug Fixes
- Removed all debug logs for better performance
- Optimized code structure for improved stability

### v0.4.7 (2025-12-02)
- **Sankey Chart Redesign**: Added "Balance" and "Reserve Depletion" nodes for accounting compliance
- **Visual Optimization**: Nodes and links sorted by amount in descending order
- **Fixes**: Fixed display issue with zero income and Moment.js warnings

### v0.4.6 (2025-12-02)
- **Copy Improvements**: Unified terminology to "Statement Reconciliation"
- **Code Quality**: Cleaned up redundant code and fixed TypeScript type errors

### v0.4.5 (2025-11-28)
- **Statement Reconciliation Feature**: Batch reconcile transactions with automatic `*` markers
- **Financial Report Feature**: Initial release with multiple chart types and trend analysis

---

## 🔧 Technical Details

### Technology Stack
- **React 17** + **TypeScript** - Component development
- **ECharts 6.0** - Professional chart rendering
- **styled-components 5.3** - CSS-in-JS styling
- **Nearley Parser** - Ledger file syntax parsing
- **Moment.js** - Date handling

### Browser Compatibility
- ✅ **Desktop**: Windows, macOS, Linux
- ✅ **Mobile**: iOS, Android (requires Obsidian mobile app)

### Data Format
- Fully compatible with [Ledger CLI](https://www.ledger-cli.org) format
- Supports interoperability with other plain text accounting tools

---

## 📚 Further Reading

Want to learn more about plain text accounting?

- [Ledger CLI Official Documentation](https://www.ledger-cli.org/3.0/doc/ledger3.html)
- [Plain Text Accounting](https://plaintextaccounting.org)
- [Principles of Accounting with Ledger](https://www.ledger-cli.org/3.0/doc/ledger3.html#Principles-of-Accounting-with-Ledger)

---

## 🤝 Contribution

Contributions of all kinds are welcome!

- 🐛 **Report Bugs**: [Submit Issue](https://github.com/Elo-Mario/ledger-obsidian/issues)
- 💡 **Feature Suggestions**: [Start Discussion](https://github.com/Elo-Mario/ledger-obsidian/discussions)
- 🔧 **Code Contributions**: [Submit Pull Request](https://github.com/Elo-Mario/ledger-obsidian/pulls)

---

## 📝 License

This project is licensed under the **GPL-3.0 License** - see the [LICENSE](LICENSE) file for details

---

## 👤 Author

**Elo-Mario**
- GitHub: [@Elo-Mario](https://github.com/Elo-Mario)
- Project: [ledger-obsidian](https://github.com/Elo-Mario/ledger-obsidian)

---

<div align="center">

**⭐ Found this helpful? Please give it a star on GitHub! ⭐**

[Star this repo](https://github.com/Elo-Mario/ledger-obsidian) · [Report Bug](https://github.com/Elo-Mario/ledger-obsidian/issues) · [Request Feature](https://github.com/Elo-Mario/ledger-obsidian/discussions)

</div>
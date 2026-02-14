import type { EnhancedTransaction, TransactionCache } from './parser';
import { filterByEndDate, filterByStartDate, getTotalAsNum } from './transaction-utils';
import { Moment } from 'moment';

/**
 * Calculate monthly financial KPI metrics
 */
export interface MonthlyKPI {
    balance: number;      // Monthly balance
    income: number;       // Monthly income
    expense: number;      // Monthly expense
    savingsRate: number;  // Savings rate (0-1)
}

export function calculateMonthlyKPI(
    txCache: TransactionCache,
    month: Moment,
): MonthlyKPI {
    const startOfMonth = month.clone().startOf('month');
    const endOfMonth = month.clone().endOf('month');

    const monthTransactions = txCache.transactions.filter((tx) => {
        const txDate = window.moment(tx.value.date, ['YYYY-MM-DD', 'YYYY/MM/DD']);
        return txDate.isSameOrAfter(startOfMonth) && txDate.isSameOrBefore(endOfMonth);
    });

    let income = 0;
    let expense = 0;

    monthTransactions.forEach((tx) => {
        tx.value.expenselines.forEach((line) => {
            if (!('account' in line)) return;

            const account = line.dealiasedAccount;

            // Income accounts
            if (account.includes('Income') || account.includes('Income')) {
                income += Math.abs(line.amount);
            }
            // Expense accounts
            else if (account.includes('Expense') || account.includes('Expense')) {
                expense += Math.abs(line.amount);
            }
        });
    });

    const balance = income - expense;
    const savingsRate = income > 0 ? balance / income : 0;

    return {
        balance,
        income,
        expense,
        savingsRate,
    };
}

/**
 * Calculate trend data for multiple months
 */
export interface TrendData {
    months: string[];
    income: number[];
    expense: number[];
    netBalance: number[];
}

export function calculateTrendData(
    txCache: TransactionCache,
    monthsCount: number = 6,
): TrendData {
    const months: string[] = [];
    const income: number[] = [];
    const expense: number[] = [];
    const netBalance: number[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
        const month = window.moment().subtract(i, 'months');
        const kpi = calculateMonthlyKPI(txCache, month);

        months.push(month.format('M'));
        income.push(kpi.income);
        expense.push(kpi.expense);
        netBalance.push(kpi.balance);
    }

    return { months, income, expense, netBalance };
}

/**
 * Calculate asset structure data (for Treemap)
 */
export interface TreemapNode {
    name: string;
    value: number;
    itemStyle?: { color: string };
    children?: TreemapNode[];
}

export function calculateAssetStructure(
    txCache: TransactionCache,
): TreemapNode[] {
    // Calculate current balance for each account
    const accountBalances = new Map<string, number>();

    txCache.transactions.forEach((tx) => {
        tx.value.expenselines.forEach((line) => {
            if (!('account' in line)) return;

            const account = line.dealiasedAccount;
            const current = accountBalances.get(account) || 0;
            accountBalances.set(account, current + line.amount);
        });
    });

    // Group by account type
    const assets: TreemapNode[] = [];
    const liabilities: TreemapNode[] = [];

    accountBalances.forEach((balance, account) => {
        if (balance === 0) return;

        const parts = account.split(':');
        const category = parts[0];
        const subcategory = parts.slice(1).join(':') || category;

        const node: TreemapNode = {
            name: subcategory,
            value: Math.abs(balance),
        };

        if (category.includes('Asset') || category.includes('Assets')) {
            assets.push(node);
        } else if (category.includes('Liab') || category.includes('Liabilities')) {
            liabilities.push(node);
        }
    });

    const result: TreemapNode[] = [];

    if (assets.length > 0) {
        result.push({
            name: 'Assets',
            value: assets.reduce((sum, a) => sum + a.value, 0),
            itemStyle: { color: '#3b82f6' },
            children: assets,
        });
    }

    if (liabilities.length > 0) {
        result.push({
            name: 'Liabilities',
            value: liabilities.reduce((sum, l) => sum + l.value, 0),
            itemStyle: { color: '#ef4444' },
            children: liabilities,
        });
    }

    return result;
}

/**
 * Generate Sankey diagram data (Income -> Expense flow)
 */
export interface SankeyData {
    nodes: Array<{ name: string }>;
    links: Array<{ source: string; target: string; value: number }>;
}

export function calculateSankeyData(
    txCache: TransactionCache,
    month: Moment,
): SankeyData {
    const startOfMonth = month.clone().startOf('month');
    const endOfMonth = month.clone().endOf('month');

    const monthTransactions = txCache.transactions.filter((tx) => {
        const txDate = window.moment(tx.value.date, ['YYYY-MM-DD', 'YYYY/MM/DD']);
        return txDate.isSameOrAfter(startOfMonth) && txDate.isSameOrBefore(endOfMonth);
    });

    // Collect income and expense flows
    const incomeBySource = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();

    monthTransactions.forEach((tx) => {
        let hasIncome = false;
        let hasExpense = false;
        const txIncomeSources: string[] = [];
        const txExpenseCategories: string[] = [];

        tx.value.expenselines.forEach((line) => {
            if (!('account' in line)) return;

            const account = line.dealiasedAccount;
            // Limit to second-level accounts
            const parts = account.split(':');
            const secondLevel = parts.slice(0, 2).join(':'); // Only first two levels

            if (account.includes('Income') || account.includes('Income')) {
                hasIncome = true;
                txIncomeSources.push(secondLevel);
                const current = incomeBySource.get(secondLevel) || 0;
                incomeBySource.set(secondLevel, current + Math.abs(line.amount));
            } else if (account.includes('Expense') || account.includes('Expense')) {
                hasExpense = true;
                txExpenseCategories.push(secondLevel);
                const current = expenseByCategory.get(secondLevel) || 0;
                expenseByCategory.set(secondLevel, current + Math.abs(line.amount));
            }
        });
    });

    // Build nodes and links
    const nodes: Array<{ name: string }> = [];
    const links: Array<{ source: string; target: string; value: number }> = [];

    // Add income source nodes
    incomeBySource.forEach((value, source) => {
        nodes.push({ name: source });
    });

    // Add expense category nodes
    expenseByCategory.forEach((value, category) => {
        nodes.push({ name: category });
    });

    // Simplified: assume income flows to all expenses proportionally
    const totalIncome = Array.from(incomeBySource.values()).reduce((sum, v) => sum + v, 0);
    const totalExpense = Array.from(expenseByCategory.values()).reduce((sum, v) => sum + v, 0);

    if (totalIncome > 0 && totalExpense > 0) {
        incomeBySource.forEach((incomeValue, source) => {
            expenseByCategory.forEach((expenseValue, category) => {
                const flowValue = (incomeValue / totalIncome) * expenseValue;
                if (flowValue > 0) {
                    links.push({
                        source,
                        target: category,
                        value: flowValue,
                    });
                }
            });
        });
    }

    return { nodes, links };
}

/**
 * Get monthly transaction details
 */
export interface Transaction {
    date: string;
    project: string;
    income: number;
    expense: number;
    balance: number;
    account: string;
    note: string;
}

export function getMonthlyTransactions(
    txCache: TransactionCache,
    month: Moment,
): Transaction[] {
    const startOfMonth = month.clone().startOf('month');
    const endOfMonth = month.clone().endOf('month');

    const monthTransactions = txCache.transactions.filter((tx) => {
        const txDate = window.moment(tx.value.date, ['YYYY-MM-DD', 'YYYY/MM/DD']);
        return txDate.isSameOrAfter(startOfMonth) && txDate.isSameOrBefore(endOfMonth);
    });

    let runningBalance = 0;
    const transactions: Transaction[] = [];

    monthTransactions.forEach((tx) => {
        const total = getTotalAsNum(tx);
        const isIncome = total < 0; // Negative values indicate income (asset increase)

        const mainAccount = tx.value.expenselines.find(line => 'account' in line && line.amount !== 0);

        runningBalance += Math.abs(total);

        transactions.push({
            date: tx.value.date,
            project: tx.value.payee,
            income: isIncome ? Math.abs(total) : 0,
            expense: !isIncome ? Math.abs(total) : 0,
            balance: runningBalance,
            account: mainAccount && 'account' in mainAccount ? mainAccount.dealiasedAccount : '',
            note: tx.value.comment || '',
        });
    });

    return transactions;
}

/**
 * Calculate daily trend data (for monthly daily income/expense trends)
 */
export interface DailyTrendData {
    dates: string[];       // Date array (1-31)
    income: number[];      // Daily income
    expense: number[];     // Daily expense
    netBalance: number[];  // Daily net balance
}

export function calculateDailyTrendData(
    txCache: TransactionCache,
    month: Moment,
): DailyTrendData {
    const startOfMonth = month.clone().startOf('month');
    const endOfMonth = month.clone().endOf('month');
    const daysInMonth = month.daysInMonth();

    // Initialize daily data
    const dailyIncome = new Map<number, number>();
    const dailyExpense = new Map<number, number>();

    // Accumulate daily income and expense
    txCache.transactions.forEach((tx) => {
        const txDate = window.moment(tx.value.date, ['YYYY-MM-DD', 'YYYY/MM/DD']);
        if (!txDate.isBetween(startOfMonth, endOfMonth, null, '[]')) return;

        const day = txDate.date();
        let dayIncome = 0;
        let dayExpense = 0;

        tx.value.expenselines.forEach((line) => {
            if (!('account' in line)) return;
            const account = line.dealiasedAccount;

            if (account.includes('Income') || account.includes('Income')) {
                dayIncome += Math.abs(line.amount);
            } else if (account.includes('Expense') || account.includes('Expense')) {
                dayExpense += Math.abs(line.amount);
            }
        });

        dailyIncome.set(day, (dailyIncome.get(day) || 0) + dayIncome);
        dailyExpense.set(day, (dailyExpense.get(day) || 0) + dayExpense);
    });

    // Build output array (only include dates with transactions)
    const dates: string[] = [];
    const income: number[] = [];
    const expense: number[] = [];
    const netBalance: number[] = [];

    let cumulativeBalance = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const dayInc = dailyIncome.get(day) || 0;
        const dayExp = dailyExpense.get(day) || 0;

        if (dayInc === 0 && dayExp === 0) continue; // Skip dates without transactions

        dates.push(day.toString());
        income.push(dayInc);
        expense.push(dayExp);
        cumulativeBalance += (dayInc - dayExp);
        netBalance.push(cumulativeBalance);
    }

    return { dates, income, expense, netBalance };
}

/**
 * Calculate assets + income structure (for Treemap)
 */
export function calculateAssetAndIncomeStructure(
    txCache: TransactionCache,
): TreemapNode[] {
    const accountBalances = new Map<string, number>();

    txCache.transactions.forEach((tx) => {
        tx.value.expenselines.forEach((line) => {
            if (!('account' in line)) return;
            const account = line.dealiasedAccount;
            const current = accountBalances.get(account) || 0;
            accountBalances.set(account, current + line.amount);
        });
    });

    // Aggregate by second-level accounts (flat structure, not nested)
    const secondLevelBalances = new Map<string, number>();

    accountBalances.forEach((balance, account) => {
        if (balance === 0) return;
        const parts = account.split(':');
        const category = parts[0];

        // Only include assets and income
        if (category.includes('Asset') || category.includes('资产') ||
            category.includes('Income') || category.includes('收入')) {
            // Get second-level account name (e.g., "Assets:Bank" get "Bank")
            const secondLevelName = parts[1] || parts[0];
            const current = secondLevelBalances.get(secondLevelName) || 0;
            secondLevelBalances.set(secondLevelName, current + balance);
        }
    });

    // Build flat Treemap data (not nested, each is top-level node)
    const result: TreemapNode[] = [];
    secondLevelBalances.forEach((balance, name) => {
        if (balance === 0) return;
        result.push({
            name: name,
            value: Math.abs(balance),
            itemStyle: { color: balance > 0 ? '#3b82f6' : '#10b981' }
        });
    });

    return result;
}

/**
 * Calculate liabilities structure (for Treemap)
 */
export function calculateLiabilitiesStructure(
    txCache: TransactionCache,
): TreemapNode[] {
    const accountBalances = new Map<string, number>();

    txCache.transactions.forEach((tx) => {
        tx.value.expenselines.forEach((line) => {
            if (!('account' in line)) return;
            const account = line.dealiasedAccount;
            const current = accountBalances.get(account) || 0;
            accountBalances.set(account, current + line.amount);
        });
    });

    // Aggregate by second-level accounts (flat structure)
    const secondLevelBalances = new Map<string, number>();

    accountBalances.forEach((balance, account) => {
        if (balance === 0) return;
        const parts = account.split(':');
        const category = parts[0];

        // Only include liabilities
        if (category.includes('Liab') || category.includes('负债')) {
            // Get second-level account name
            const secondLevelName = parts[1] || parts[0];
            const current = secondLevelBalances.get(secondLevelName) || 0;
            secondLevelBalances.set(secondLevelName, current + Math.abs(balance));
        }
    });

    // Build flat Treemap data
    const result: TreemapNode[] = [];
    secondLevelBalances.forEach((balance, name) => {
        if (balance === 0) return;
        result.push({
            name: name,
            value: balance,
            itemStyle: { color: '#ef4444' }
        });
    });

    return result;
}

/**
 * Get transaction details with source/target accounts
 */
export interface TransactionRow {
    date: string;          // Date
    payee: string;         // Payee
    amount: number;        // Amount
    sourceAccount: string; // Source account
    targetAccount: string; // Target account
}

export function getTransactionsWithAccounts(
    txCache: TransactionCache,
    month: Moment,
): TransactionRow[] {
    const startOfMonth = month.clone().startOf('month');
    const endOfMonth = month.clone().endOf('month');

    const monthTransactions = txCache.transactions.filter((tx) => {
        const txDate = window.moment(tx.value.date, ['YYYY-MM-DD', 'YYYY/MM/DD']);
        return txDate.isSameOrAfter(startOfMonth) && txDate.isSameOrBefore(endOfMonth);
    });

    const transactions: TransactionRow[] = [];

    monthTransactions.forEach((tx) => {
        // Find accounts with positive/negative amounts
        const positiveLines = tx.value.expenselines.filter(line => 'account' in line && line.amount > 0);
        const negativeLines = tx.value.expenselines.filter(line => 'account' in line && line.amount < 0);

        const sourceAccount = negativeLines.length > 0 && 'account' in negativeLines[0]
            ? negativeLines[0].dealiasedAccount
            : '';
        const targetAccount = positiveLines.length > 0 && 'account' in positiveLines[0]
            ? positiveLines[0].dealiasedAccount
            : '';

        const amount = positiveLines.length > 0 && 'amount' in positiveLines[0]
            ? Math.abs(positiveLines[0].amount)
            : 0;

        transactions.push({
            date: window.moment(tx.value.date, ['YYYY-MM-DD', 'YYYY/MM/DD']).format('MM-DD'),
            payee: tx.value.payee,
            amount,
            sourceAccount,
            targetAccount,
        });
    });

    return transactions.reverse();
}

/**
 * Build hierarchical tree structure
 */
export function buildHierarchy(balances: Map<string, number>): TreemapNode[] {
    const root: TreemapNode[] = [];

    // Helper to find or create a node
    function findOrCreateNode(path: string[], parentChildren: TreemapNode[]): TreemapNode {
        const name = path[0];
        let node = parentChildren.find(n => n.name === name);

        if (!node) {
            node = {
                name,
                value: 0,
                children: []
            };
            parentChildren.push(node);
        }

        if (path.length > 1) {
            // Need to ensure children array exists
            if (!node.children) node.children = [];
            return findOrCreateNode(path.slice(1), node.children);
        }

        return node;
    }

    balances.forEach((value, account) => {
        if (value === 0) return;
        const parts = account.split(':');
        // Skip the first part (Asset/Liability) as we are building the tree INSIDE that category
        const meaningfulParts = parts.slice(1); // Remove 'Assets' or 'Liabilities' prefix
        if (meaningfulParts.length === 0) return;

        const leaf = findOrCreateNode(meaningfulParts, root);
        leaf.value += value;
    });

    // Recalculate values for non-leaf nodes
    function sumValues(nodes: TreemapNode[]): number {
        let total = 0;
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.value = sumValues(node.children);
            }
            total += node.value;
        });
        return total;
    }

    sumValues(root);
    return root;
}

/**
 * Calculate dual treemap data (Assets & Liabilities)
 * Up to the end of specified month (or current date)
 */
export function calculateDualTreemapData(
    txCache: TransactionCache,
    month: Moment,
): { assets: TreemapNode[], liabilities: TreemapNode[] } {
    // Determine cutoff date
    const now = window.moment();
    const endOfMonth = month.clone().endOf('month');
    // If endOfMonth is after NOW, use NOW.
    const cutoffDate = endOfMonth.isAfter(now) ? now : endOfMonth;

    const accountBalances = new Map<string, number>();

    txCache.transactions.forEach((tx) => {
        const txDate = window.moment(tx.value.date, ['YYYY-MM-DD', 'YYYY/MM/DD']);
        if (txDate.isAfter(cutoffDate)) return;

        tx.value.expenselines.forEach((line) => {
            if (!('account' in line)) return;
            const account = line.dealiasedAccount;
            const current = accountBalances.get(account) || 0;
            accountBalances.set(account, current + line.amount);
        });
    });

    const assetBalances = new Map<string, number>();
    const liabilityBalances = new Map<string, number>();

    accountBalances.forEach((balance, account) => {
        if (Math.abs(balance) < 0.01) return; // Ignore zero/dust

        if (account.startsWith('Assets') || account.startsWith('资产')) {
            assetBalances.set(account, Math.abs(balance)); // Assets are usually positive
        } else if (account.startsWith('Liabilities') || account.startsWith('负债')) {
            liabilityBalances.set(account, Math.abs(balance)); // Liabilities are negative in Ledger, take abs
        }
    });

    return {
        assets: buildHierarchy(assetBalances),
        liabilities: buildHierarchy(liabilityBalances)
    };
}

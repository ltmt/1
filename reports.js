/**
 * 报表生成模块
 * 负责月度/年度利润报表生成和数据可视化
 */

class ReportManager {
  constructor(storageManager, transactionManager, costManager) {
    this.storage = storageManager;
    this.transactionManager = transactionManager;
    this.costManager = costManager;
  }

  generateMonthlyReport(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const startDate = `${monthStr}-01`;
    const endDate = `${monthStr}-${new Date(year, month, 0).getDate()}`;

    const transactions = this.storage.getTransactions({ startDate, endDate });
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const monthlyCosts = this.costManager.monthlyCosts(year, month);
    const totalCosts = monthlyCosts.total;

    const grossProfit = totalIncome - totalCosts;
    const netProfit = totalIncome - totalExpense - totalCosts;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome * 100) : 0;

    const lastMonth = month === 1 ? 12 : month - 1;
    const lastYear = month === 1 ? year - 1 : year;
    const lastMonthData = this.getLastMonthComparison(lastYear, lastMonth);

    const incomeBreakdown = this.groupByCategory(incomeTransactions, 'income');
    const expenseBreakdown = this.groupByCategory(expenseTransactions, 'expense');

    return {
      month: monthStr,
      monthName: `${year}年${month}月`,
      period: {
        startDate,
        endDate
      },
      income: {
        total: totalIncome,
        breakdown: incomeBreakdown,
        count: incomeTransactions.length
      },
      expense: {
        total: totalExpense,
        breakdown: expenseBreakdown,
        count: expenseTransactions.length
      },
      cost: {
        labor: monthlyCosts.laborTotal,
        material: monthlyCosts.materialTotal,
        total: totalCosts
      },
      profit: {
        gross: grossProfit,
        net: netProfit,
        margin: profitMargin.toFixed(2)
      },
      comparison: lastMonthData
    };
  }

  generateYearlyReport(year) {
    const monthlyReports = [];
    let totalIncome = 0;
    let totalExpense = 0;
    let totalCosts = 0;
    let totalLabor = 0;
    let totalMaterial = 0;

    for (let month = 1; month <= 12; month++) {
      const report = this.generateMonthlyReport(year, month);
      monthlyReports.push(report);

      totalIncome += report.income.total;
      totalExpense += report.expense.total;
      totalCosts += report.cost.total;
      totalLabor += report.cost.labor;
      totalMaterial += report.cost.material;
    }

    const grossProfit = totalIncome - totalCosts;
    const netProfit = totalIncome - totalExpense - totalCosts;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome * 100) : 0;

    return {
      year: year.toString(),
      yearName: `${year}年`,
      monthlyReports,
      summary: {
        income: totalIncome,
        expense: totalExpense,
        costs: totalCosts,
        labor: totalLabor,
        material: totalMaterial,
        grossProfit,
        netProfit,
        profitMargin: profitMargin.toFixed(2)
      }
    };
  }

  getLastMonthComparison(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const startDate = `${monthStr}-01`;
    const endDate = `${monthStr}-${new Date(year, month, 0).getDate()}`;

    const transactions = this.storage.getTransactions({ startDate, endDate });
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const monthlyCosts = this.costManager.monthlyCosts(year, month);
    const totalCosts = monthlyCosts.total;

    const netProfit = totalIncome - totalExpense - totalCosts;

    return {
      income: totalIncome,
      expense: totalExpense,
      costs: totalCosts,
      netProfit
    };
  }

  groupByCategory(transactions, type) {
    const grouped = {};
    const categories = type === 'income'
      ? { sales: '销售收入', service: '服务收入', investment: '投资收益', other_income: '其他收入' }
      : { purchase: '采购成本', operation: '运营费用', marketing: '营销费用', tax: '税费', other_expense: '其他支出' };

    transactions.forEach(t => {
      if (!grouped[t.category]) {
        grouped[t.category] = {
          categoryName: categories[t.category] || t.category,
          amount: 0,
          count: 0
        };
      }
      grouped[t.category].amount += t.amount;
      grouped[t.category].count++;
    });

    return grouped;
  }

  getProfitTrend(months = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const report = this.generateMonthlyReport(year, month);
      trends.push({
        month: report.month,
        monthName: report.monthName,
        income: report.income.total,
        expense: report.expense.total,
        costs: report.cost.total,
        netProfit: report.profit.net,
        profitMargin: report.profit.margin
      });
    }

    return trends;
  }

  getCostTrend(months = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const costs = this.costManager.monthlyCosts(year, month);
      trends.push({
        month: `${year}-${String(month).padStart(2, '0')}`,
        monthName: `${year}年${month}月`,
        labor: costs.laborTotal,
        material: costs.materialTotal,
        total: costs.total
      });
    }

    return trends;
  }

  getIncomeExpenseTrend(months = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;

      const report = this.generateMonthlyReport(year, month);
      trends.push({
        month: report.month,
        monthName: report.monthName,
        income: report.income.total,
        expense: report.expense.total
      });
    }

    return trends;
  }

  getDashboardData() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const currentMonth = this.generateMonthlyReport(year, month);
    const profitTrend = this.getProfitTrend(6);

    const recentTransactions = this.transactionManager.getRecentTransactions(5);
    const topIncomeCategories = this.transactionManager.getTopCategories('income', 'month', 3);
    const topExpenseCategories = this.transactionManager.getTopCategories('expense', 'month', 3);
    const topCostItems = this.costManager.getTopCostItems(year, month, 3);

    return {
      currentMonth,
      profitTrend,
      recentTransactions,
      topIncomeCategories,
      topExpenseCategories,
      topCostItems,
      summary: {
        totalIncome: currentMonth.income.total,
        totalExpense: currentMonth.expense.total,
        totalCosts: currentMonth.cost.total,
        netProfit: currentMonth.profit.net,
        profitMargin: currentMonth.profit.margin
      }
    };
  }

  formatCurrency(amount) {
    return '¥' + parseFloat(amount).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatPercentage(value) {
    return parseFloat(value).toFixed(2) + '%';
  }

  exportMonthlyReport(year, month) {
    const report = this.generateMonthlyReport(year, month);
    const lines = [];

    lines.push(`${report.monthName}利润报表`);
    lines.push('=' .repeat(50));
    lines.push('');

    lines.push('一、收入情况');
    lines.push(`总收入: ${this.formatCurrency(report.income.total)}`);
    lines.push(`收入笔数: ${report.income.count}`);
    Object.entries(report.income.breakdown).forEach(([key, value]) => {
      lines.push(`  - ${value.categoryName}: ${this.formatCurrency(value.amount)}`);
    });
    lines.push('');

    lines.push('二、支出情况');
    lines.push(`总支出: ${this.formatCurrency(report.expense.total)}`);
    lines.push(`支出笔数: ${report.expense.count}`);
    Object.entries(report.expense.breakdown).forEach(([key, value]) => {
      lines.push(`  - ${value.categoryName}: ${this.formatCurrency(value.amount)}`);
    });
    lines.push('');

    lines.push('三、成本情况');
    lines.push(`人工成本: ${this.formatCurrency(report.cost.labor)}`);
    lines.push(`物料成本: ${this.formatCurrency(report.cost.material)}`);
    lines.push(`总成本: ${this.formatCurrency(report.cost.total)}`);
    lines.push('');

    lines.push('四、利润情况');
    lines.push(`毛利润: ${this.formatCurrency(report.profit.gross)}`);
    lines.push(`净利润: ${this.formatCurrency(report.profit.net)}`);
    lines.push(`利润率: ${report.profit.margin}%`);
    lines.push('');

    if (report.comparison) {
      lines.push('五、环比分析');
      const incomeChange = report.income.total - report.comparison.income;
      const expenseChange = report.expense.total - report.comparison.expense;
      const profitChange = report.profit.net - report.comparison.netProfit;

      lines.push(`收入变化: ${incomeChange >= 0 ? '+' : ''}${this.formatCurrency(incomeChange)}`);
      lines.push(`支出变化: ${expenseChange >= 0 ? '+' : ''}${this.formatCurrency(expenseChange)}`);
      lines.push(`利润变化: ${profitChange >= 0 ? '+' : ''}${this.formatCurrency(profitChange)}`);
    }

    return lines.join('\n');
  }

  downloadMonthlyReport(year, month) {
    const report = this.exportMonthlyReport(year, month);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${year}年${month}月利润报表.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadYearlyReport(year) {
    const report = this.generateYearlyReport(year);
    const lines = [];

    lines.push(`${report.yearName}年度利润报表汇总`);
    lines.push('=' .repeat(50));
    lines.push('');

    lines.push('年度汇总');
    lines.push(`总收入: ${this.formatCurrency(report.summary.income)}`);
    lines.push(`总支出: ${this.formatCurrency(report.summary.expense)}`);
    lines.push(`人工成本: ${this.formatCurrency(report.summary.labor)}`);
    lines.push(`物料成本: ${this.formatCurrency(report.summary.material)}`);
    lines.push(`总成本: ${this.formatCurrency(report.summary.costs)}`);
    lines.push(`毛利润: ${this.formatCurrency(report.summary.grossProfit)}`);
    lines.push(`净利润: ${this.formatCurrency(report.summary.netProfit)}`);
    lines.push(`利润率: ${report.summary.profitMargin}%`);
    lines.push('');

    lines.push('月度明细');
    report.monthlyReports.forEach(month => {
      lines.push(`${month.monthName}: 收入${this.formatCurrency(month.income.total)}, 支出${this.formatCurrency(month.expense.total)}, 成本${this.formatCurrency(month.cost.total)}, 利润${this.formatCurrency(month.profit.net)}`);
    });

    return lines.join('\n');
  }
}

window.ReportManager = ReportManager;

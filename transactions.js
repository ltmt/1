/**
 * 收支统计模块
 * 负责收支记录的CRUD、统计计算和数据筛选过滤
 */

class TransactionManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.categories = {
      income: {
        sales: '销售收入',
        service: '服务收入',
        investment: '投资收益',
        other_income: '其他收入'
      },
      expense: {
        purchase: '采购成本',
        operation: '运营费用',
        marketing: '营销费用',
        tax: '税费',
        other_expense: '其他支出'
      }
    };
  }

  addTransaction(type, category, amount, date, remark = '') {
    const transaction = {
      type,
      category,
      amount: parseFloat(amount) || 0,
      date: date || this.formatDate(new Date()),
      remark: remark.trim()
    };

    if (transaction.amount <= 0) {
      return { success: false, message: '金额必须大于0' };
    }

    this.storage.saveTransaction(transaction);
    return { success: true, message: '记录成功', data: transaction };
  }

  updateTransaction(id, type, category, amount, date, remark = '') {
    const transaction = {
      id,
      type,
      category,
      amount: parseFloat(amount) || 0,
      date,
      remark: remark.trim()
    };

    if (transaction.amount <= 0) {
      return { success: false, message: '金额必须大于0' };
    }

    this.storage.saveTransaction(transaction);
    return { success: true, message: '更新成功', data: transaction };
  }

  deleteTransaction(id) {
    this.storage.deleteTransaction(id);
    return { success: true, message: '删除成功' };
  }

  getAllTransactions(filters = {}) {
    return this.storage.getTransactions(filters);
  }

  getTransactionsByPeriod(period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'day':
        startDate = endDate = this.formatDate(now);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = this.formatDate(weekStart);
        endDate = this.formatDate(now);
        break;
      case 'month':
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        endDate = this.formatDate(now);
        break;
      case 'year':
        startDate = `${now.getFullYear()}-01-01`;
        endDate = this.formatDate(now);
        break;
      default:
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        endDate = this.formatDate(now);
    }

    return this.storage.getTransactions({ startDate, endDate });
  }

  getByCategory(period = 'month') {
    const transactions = this.getTransactionsByPeriod(period);
    const result = {
      income: {},
      expense: {},
      totalIncome: 0,
      totalExpense: 0
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        if (!result.income[t.category]) {
          result.income[t.category] = {
            categoryName: this.categories.income[t.category] || t.category,
            amount: 0,
            count: 0
          };
        }
        result.income[t.category].amount += t.amount;
        result.income[t.category].count++;
        result.totalIncome += t.amount;
      } else {
        if (!result.expense[t.category]) {
          result.expense[t.category] = {
            categoryName: this.categories.expense[t.category] || t.category,
            amount: 0,
            count: 0
          };
        }
        result.expense[t.category].amount += t.amount;
        result.expense[t.category].count++;
        result.totalExpense += t.amount;
      }
    });

    return result;
  }

  calculateSummary(period = 'month') {
    const transactions = this.getTransactionsByPeriod(period);
    const income = transactions.filter(t => t.type === 'income');
    const expense = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpense;

    const incomeBreakdown = this.groupByCategory(income);
    const expenseBreakdown = this.groupByCategory(expense);

    return {
      period,
      totalIncome,
      totalExpense,
      netAmount,
      incomeCount: income.length,
      expenseCount: expense.length,
      incomeBreakdown,
      expenseBreakdown,
      incomeRatio: totalIncome > 0 ? (totalExpense / totalIncome * 100) : 0
    };
  }

  groupByCategory(transactions) {
    const grouped = {};
    transactions.forEach(t => {
      if (!grouped[t.category]) {
        grouped[t.category] = {
          categoryName: this.categories[t.type]?.[t.category] || t.category,
          amount: 0,
          count: 0
        };
      }
      grouped[t.category].amount += t.amount;
      grouped[t.category].count++;
    });
    return grouped;
  }

  getRecentTransactions(limit = 10) {
    const transactions = this.storage.getTransactions();
    return transactions.slice(0, limit);
  }

  searchTransactions(keyword) {
    const transactions = this.storage.getTransactions();
    if (!keyword || keyword.trim() === '') {
      return transactions;
    }

    const lowerKeyword = keyword.toLowerCase().trim();
    return transactions.filter(t =>
      t.remark.toLowerCase().includes(lowerKeyword) ||
      t.category.toLowerCase().includes(lowerKeyword) ||
      t.amount.toString().includes(lowerKeyword) ||
      t.date.includes(lowerKeyword)
    );
  }

  getCategoryName(type, category) {
    return this.categories[type]?.[category] || category;
  }

  getCategories(type) {
    return this.categories[type] || {};
  }

  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  formatCurrency(amount) {
    return '¥' + parseFloat(amount).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  comparePeriods(currentPeriod, previousPeriod) {
    const current = this.calculateSummary(currentPeriod);
    const previous = this.calculateSummary(previousPeriod);

    const incomeChange = current.totalIncome - previous.totalIncome;
    const expenseChange = current.totalExpense - previous.totalExpense;
    const netChange = current.netAmount - previous.netAmount;

    const incomePercent = previous.totalIncome > 0
      ? ((current.totalIncome - previous.totalIncome) / previous.totalIncome * 100)
      : 0;
    const expensePercent = previous.totalExpense > 0
      ? ((current.totalExpense - previous.totalExpense) / previous.totalExpense * 100)
      : 0;
    const netPercent = previous.netAmount !== 0
      ? ((current.netAmount - previous.netAmount) / Math.abs(previous.netAmount) * 100)
      : 0;

    return {
      current,
      previous,
      incomeChange,
      expenseChange,
      netChange,
      incomePercent: incomePercent.toFixed(1),
      expensePercent: expensePercent.toFixed(1),
      netPercent: netPercent.toFixed(1),
      incomeTrend: incomeChange >= 0 ? 'up' : 'down',
      expenseTrend: expenseChange >= 0 ? 'up' : 'down',
      netTrend: netChange >= 0 ? 'up' : 'down'
    };
  }

  getMonthlyTrend(months = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${new Date(year, targetDate.getMonth() + 1, 0).getDate()}`;

      const transactions = this.storage.getTransactions({ startDate, endDate });
      const income = transactions.filter(t => t.type === 'income');
      const expense = transactions.filter(t => t.type === 'expense');

      trends.push({
        month: `${year}-${month}`,
        monthName: `${year}年${targetDate.getMonth() + 1}月`,
        income: income.reduce((sum, t) => sum + t.amount, 0),
        expense: expense.reduce((sum, t) => sum + t.amount, 0),
        net: income.reduce((sum, t) => sum + t.amount, 0) - expense.reduce((sum, t) => sum + t.amount, 0)
      });
    }

    return trends;
  }

  getTopCategories(type, period = 'month', limit = 5) {
    const summary = this.getByCategory(period);
    const categories = type === 'income' ? summary.income : summary.expense;

    return Object.entries(categories)
      .map(([key, value]) => ({
        category: key,
        ...value
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  exportToCSV() {
    const transactions = this.storage.getTransactions();
    const headers = ['日期', '类型', '类别', '金额', '备注', '创建时间'];
    const rows = transactions.map(t => [
      t.date,
      t.type === 'income' ? '收入' : '支出',
      this.getCategoryName(t.type, t.category),
      t.amount,
      t.remark,
      t.createdAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  downloadCSV() {
    const csv = this.exportToCSV();
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `收支记录_${this.formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.TransactionManager = TransactionManager;

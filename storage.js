/**
 * 数据存储管理模块
 * 负责LocalStorage的读写操作和数据格式化
 */

class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      PRODUCTS: 'finance_app_products',
      TRANSACTIONS: 'finance_app_transactions',
      COSTS: 'finance_app_costs',
      ROI_RECORDS: 'finance_app_roi_records',
      SETTINGS: 'finance_app_settings'
    };
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.COSTS)) {
      localStorage.setItem(this.STORAGE_KEYS.COSTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.ROI_RECORDS)) {
      localStorage.setItem(this.STORAGE_KEYS.ROI_RECORDS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify({
        currency: 'CNY',
        dateFormat: 'YYYY-MM-DD',
        theme: 'dark'
      }));
    }
  }

  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getProducts() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PRODUCTS)) || [];
    } catch (e) {
      console.error('Error loading products:', e);
      return [];
    }
  }

  saveProduct(product) {
    const products = this.getProducts();
    const now = new Date().toISOString();

    if (product.id) {
      const index = products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        products[index] = {
          ...products[index],
          ...product,
          updatedAt: now
        };
      }
    } else {
      product.id = this.generateId();
      product.createdAt = now;
      product.updatedAt = now;
      products.push(product);
    }

    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return product;
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
  }

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id);
  }

  getTransactions(filters = {}) {
    try {
      let transactions = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS)) || [];

      if (filters.type) {
        transactions = transactions.filter(t => t.type === filters.type);
      }

      if (filters.category) {
        transactions = transactions.filter(t => t.category === filters.category);
      }

      if (filters.startDate) {
        transactions = transactions.filter(t => t.date >= filters.startDate);
      }

      if (filters.endDate) {
        transactions = transactions.filter(t => t.date <= filters.endDate);
      }

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      return transactions;
    } catch (e) {
      console.error('Error loading transactions:', e);
      return [];
    }
  }

  saveTransaction(transaction) {
    const transactions = this.getTransactions();
    const now = new Date().toISOString();

    if (transaction.id) {
      const index = transactions.findIndex(t => t.id === transaction.id);
      if (index !== -1) {
        transactions[index] = {
          ...transactions[index],
          ...transaction,
          updatedAt: now
        };
      }
    } else {
      transaction.id = this.generateId();
      transaction.createdAt = now;
      transaction.updatedAt = now;
      transactions.push(transaction);
    }

    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return transaction;
  }

  deleteTransaction(id) {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return true;
  }

  getCosts(filters = {}) {
    try {
      let costs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.COSTS)) || [];

      if (filters.month) {
        costs = costs.filter(c => c.month === filters.month);
      }

      if (filters.category) {
        costs = costs.filter(c => c.category === filters.category);
      }

      if (filters.year) {
        costs = costs.filter(c => c.month.startsWith(filters.year));
      }

      return costs;
    } catch (e) {
      console.error('Error loading costs:', e);
      return [];
    }
  }

  saveCost(cost) {
    const costs = this.getCosts();
    const now = new Date().toISOString();

    if (cost.id) {
      const index = costs.findIndex(c => c.id === cost.id);
      if (index !== -1) {
        costs[index] = {
          ...costs[index],
          ...cost,
          updatedAt: now
        };
      }
    } else {
      cost.id = this.generateId();
      cost.createdAt = now;
      cost.updatedAt = now;
      costs.push(cost);
    }

    localStorage.setItem(this.STORAGE_KEYS.COSTS, JSON.stringify(costs));
    return cost;
  }

  deleteCost(id) {
    const costs = this.getCosts();
    const filtered = costs.filter(c => c.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.COSTS, JSON.stringify(filtered));
    return true;
  }

  getROIRecords(filters = {}) {
    try {
      let records = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ROI_RECORDS)) || [];

      if (filters.type) {
        records = records.filter(r => r.type === filters.type);
      }

      if (filters.startDate) {
        records = records.filter(r => r.date >= filters.startDate);
      }

      if (filters.endDate) {
        records = records.filter(r => r.date <= filters.endDate);
      }

      records.sort((a, b) => new Date(b.date) - new Date(a.date));

      return records;
    } catch (e) {
      console.error('Error loading ROI records:', e);
      return [];
    }
  }

  saveROIRecord(record) {
    const records = this.getROIRecords();
    const now = new Date().toISOString();

    if (record.id) {
      const index = records.findIndex(r => r.id === record.id);
      if (index !== -1) {
        records[index] = {
          ...records[index],
          ...record,
          updatedAt: now
        };
      }
    } else {
      record.id = this.generateId();
      record.createdAt = now;
      record.updatedAt = now;
      records.push(record);
    }

    localStorage.setItem(this.STORAGE_KEYS.ROI_RECORDS, JSON.stringify(records));
    return record;
  }

  deleteROIRecord(id) {
    const records = this.getROIRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.ROI_RECORDS, JSON.stringify(filtered));
    return true;
  }

  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS)) || {};
    } catch (e) {
      console.error('Error loading settings:', e);
      return {};
    }
  }

  saveSettings(settings) {
    localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }

  exportData() {
    return {
      products: this.getProducts(),
      transactions: this.getTransactions(),
      costs: this.getCosts(),
      roiRecords: this.getROIRecords(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString()
    };
  }

  importData(data) {
    if (data.products) {
      localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
    }
    if (data.transactions) {
      localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
    }
    if (data.costs) {
      localStorage.setItem(this.STORAGE_KEYS.COSTS, JSON.stringify(data.costs));
    }
    if (data.roiRecords) {
      localStorage.setItem(this.STORAGE_KEYS.ROI_RECORDS, JSON.stringify(data.roiRecords));
    }
    if (data.settings) {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    return true;
  }

  clearAllData() {
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(this.STORAGE_KEYS.COSTS, JSON.stringify([]));
    localStorage.setItem(this.STORAGE_KEYS.ROI_RECORDS, JSON.stringify([]));
    return true;
  }

  calculateSummary(period = 'month') {
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
    }

    const transactions = this.getTransactions({ startDate, endDate });
    const income = transactions.filter(t => t.type === 'income');
    const expense = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);

    const year = now.getFullYear();
    const month = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const costs = this.getCosts({ year, month });
    const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);

    const grossProfit = totalIncome - totalCosts;
    const netProfit = totalIncome - totalExpense - totalCosts;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome * 100) : 0;

    return {
      period,
      startDate,
      endDate,
      income: totalIncome,
      expense: totalExpense,
      costs: totalCosts,
      grossProfit,
      netProfit,
      profitMargin: profitMargin.toFixed(2)
    };
  }

  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  getLastPeriodSummary(period = 'month') {
    const now = new Date();
    let lastPeriodStart, lastPeriodEnd;

    switch (period) {
      case 'month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        lastPeriodStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        lastPeriodEnd = this.formatDate(lastMonthEnd);
        break;
      case 'year':
        const lastYear = now.getFullYear() - 1;
        lastPeriodStart = `${lastYear}-01-01`;
        lastPeriodEnd = `${lastYear}-12-31`;
        break;
    }

    const transactions = this.getTransactions({ startDate: lastPeriodStart, endDate: lastPeriodEnd });
    const income = transactions.filter(t => t.type === 'income');
    const expense = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);

    const year = lastPeriodStart.split('-')[0];
    const month = lastPeriodStart.substring(0, 7);
    const costs = this.getCosts({ year, month });
    const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);

    const netProfit = totalIncome - totalExpense - totalCosts;

    return {
      income: totalIncome,
      expense: totalExpense,
      costs: totalCosts,
      netProfit
    };
  }
}

window.StorageManager = StorageManager;

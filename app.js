/**
 * 老板财务助手 - 主应用逻辑
 * 整合所有模块，管理应用状态和UI渲染
 */

class FinanceApp {
  constructor() {
    this.storage = new StorageManager();
    this.calculator = new Calculator(this.storage);
    this.transactionManager = new TransactionManager(this.storage);
    this.costManager = new CostManager(this.storage);
    this.reportManager = new ReportManager(this.storage, this.transactionManager, this.costManager);
    this.roiManager = new ROIManager(this.storage, this.calculator);

    this.currentPage = 'home';
    this.currentTab = 'products';
    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = new Date().getMonth() + 1;

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.renderCurrentPage();
  }

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.currentTarget.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) {
        item.classList.add('active');
      }
    });
    this.renderCurrentPage();
  }

  setupEventListeners() {
    this.setupCalculatorEvents();
    this.setupTransactionEvents();
    this.setupCostEvents();
    this.setupROIEvents();
    this.setupReportEvents();
    this.setupSettingsEvents();
  }

  setupCalculatorEvents() {
    const calcForm = document.getElementById('calculator-form');
    if (calcForm) {
      calcForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCalculatorSubmit();
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.matches('.delete-product')) {
        const id = e.target.dataset.id;
        if (confirm('确定要删除这个商品吗？')) {
          this.calculator.deleteProduct(id);
          this.renderProducts();
        }
      }
      if (e.target.matches('.edit-product')) {
        const id = e.target.dataset.id;
        this.editProduct(id);
      }
    });

    document.getElementById('product-search')?.addEventListener('input', (e) => {
      this.renderProducts(e.target.value);
    });
  }

  handleCalculatorSubmit() {
    const name = document.getElementById('product-name').value;
    const costPrice = document.getElementById('cost-price').value;
    const sellingPrice = document.getElementById('selling-price').value;

    if (!name || !costPrice || !sellingPrice) {
      this.showToast('请填写完整信息', 'error');
      return;
    }

    const result = this.calculator.addProduct(name, costPrice, sellingPrice);
    if (result) {
      this.showToast('商品添加成功', 'success');
      this.clearCalculatorForm();
      this.renderProducts();
    }
  }

  editProduct(id) {
    const product = this.storage.getProductById(id);
    if (product) {
      document.getElementById('product-name').value = product.name;
      document.getElementById('cost-price').value = product.costPrice;
      document.getElementById('selling-price').value = product.sellingPrice;
      document.getElementById('product-id').value = product.id;
      document.getElementById('calc-submit-btn').textContent = '更新商品';
      this.showToast('请修改信息后点击更新', 'info');
    }
  }

  clearCalculatorForm() {
    document.getElementById('product-name').value = '';
    document.getElementById('cost-price').value = '';
    document.getElementById('selling-price').value = '';
    document.getElementById('product-id').value = '';
    document.getElementById('calc-submit-btn').textContent = '添加商品';
  }

  renderProducts(searchKeyword = '') {
    const container = document.getElementById('products-list');
    if (!container) return;

    let products = searchKeyword
      ? this.calculator.searchProducts(searchKeyword)
      : this.calculator.getAllProducts();

    if (products.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>暂无商品数据</p>
          <p class="text-muted">请添加商品来计算毛利率</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(product => `
      <div class="card product-card" data-id="${product.id}">
        <div class="card-body">
          <h3 class="card-title">${product.name}</h3>
          <div class="product-info">
            <div class="info-item">
              <span class="label">成本价：</span>
              <span class="value">${this.formatCurrency(product.costPrice)}</span>
            </div>
            <div class="info-item">
              <span class="label">售价：</span>
              <span class="value">${this.formatCurrency(product.sellingPrice)}</span>
            </div>
            <div class="info-item">
              <span class="label">毛利额：</span>
              <span class="value highlight">${this.formatCurrency(product.grossProfit)}</span>
            </div>
            <div class="info-item">
              <span class="label">毛利率：</span>
              <span class="value highlight">${product.grossMargin}%</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-secondary edit-product" data-id="${product.id}">编辑</button>
            <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}">删除</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  setupTransactionEvents() {
    const transForm = document.getElementById('transaction-form');
    if (transForm) {
      transForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleTransactionSubmit();
      });
    }

    document.querySelectorAll('.type-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const type = e.target.dataset.type;
        this.renderTransactionList(type);
      });
    });

    document.addEventListener('click', (e) => {
      if (e.target.matches('.delete-transaction')) {
        const id = e.target.dataset.id;
        if (confirm('确定要删除这条记录吗？')) {
          this.transactionManager.deleteTransaction(id);
          this.renderTransactionList();
          this.showToast('删除成功', 'success');
        }
      }
    });
  }

  handleTransactionSubmit() {
    const type = document.getElementById('transaction-type').value;
    const category = document.getElementById('transaction-category').value;
    const amount = document.getElementById('transaction-amount').value;
    const date = document.getElementById('transaction-date').value;
    const remark = document.getElementById('transaction-remark').value;

    if (!amount || parseFloat(amount) <= 0) {
      this.showToast('请输入有效的金额', 'error');
      return;
    }

    const result = this.transactionManager.addTransaction(type, category, amount, date, remark);
    if (result.success) {
      this.showToast('记录成功', 'success');
      this.clearTransactionForm();
      this.renderTransactionList();
    } else {
      this.showToast(result.message, 'error');
    }
  }

  clearTransactionForm() {
    document.getElementById('transaction-amount').value = '';
    document.getElementById('transaction-remark').value = '';
  }

  renderTransactionList(type = 'income') {
    const container = document.getElementById('transactions-list');
    if (!container) return;

    const transactions = this.storage.getTransactions({ type });

    if (transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>暂无${type === 'income' ? '收入' : '支出'}记录</p>
        </div>
      `;
      return;
    }

    container.innerHTML = transactions.map(t => `
      <div class="card transaction-card">
        <div class="card-body">
          <div class="transaction-header">
            <span class="category-badge">${this.transactionManager.getCategoryName(t.type, t.category)}</span>
            <span class="amount ${t.type === 'income' ? 'income' : 'expense'}">
              ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
            </span>
          </div>
          <div class="transaction-info">
            <span class="date">${t.date}</span>
            ${t.remark ? `<span class="remark">${t.remark}</span>` : ''}
          </div>
          <button class="btn btn-sm btn-danger delete-transaction" data-id="${t.id}">删除</button>
        </div>
      </div>
    `).join('');
  }

  updateCategoryOptions() {
    const type = document.getElementById('transaction-type').value;
    const categorySelect = document.getElementById('transaction-category');
    const categories = this.transactionManager.getCategories(type);

    categorySelect.innerHTML = Object.entries(categories).map(([key, value]) =>
      `<option value="${key}">${value}</option>`
    ).join('');
  }

  setupCostEvents() {
    const costForm = document.getElementById('cost-form');
    if (costForm) {
      costForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCostSubmit();
      });
    }

    document.querySelectorAll('.cost-type-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.cost-type-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const category = e.target.dataset.category;
        this.renderCostList(category);
      });
    });

    document.addEventListener('click', (e) => {
      if (e.target.matches('.delete-cost')) {
        const id = e.target.dataset.id;
        if (confirm('确定要删除这条成本记录吗？')) {
          this.costManager.deleteCost(id);
          this.renderCostList();
          this.showToast('删除成功', 'success');
        }
      }
    });
  }

  handleCostSubmit() {
    const category = document.getElementById('cost-category').value;
    const item = document.getElementById('cost-item').value;
    const amount = document.getElementById('cost-amount').value;
    const month = document.getElementById('cost-month').value;
    const remark = document.getElementById('cost-remark').value;

    if (!amount || parseFloat(amount) <= 0) {
      this.showToast('请输入有效的金额', 'error');
      return;
    }

    const result = this.costManager.addCost(category, item, amount, month, remark);
    if (result.success) {
      this.showToast('成本记录成功', 'success');
      this.clearCostForm();
      this.renderCostList();
    } else {
      this.showToast(result.message, 'error');
    }
  }

  clearCostForm() {
    document.getElementById('cost-amount').value = '';
    document.getElementById('cost-remark').value = '';
  }

  renderCostList(category = 'labor') {
    const container = document.getElementById('costs-list');
    if (!container) return;

    const costs = category === 'labor'
      ? this.costManager.getLaborCosts(this.selectedYear, this.selectedMonth)
      : this.costManager.getMaterialCosts(this.selectedYear, this.selectedMonth);

    const monthly = this.costManager.monthlyCosts(this.selectedYear, this.selectedMonth);

    if (costs.costs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>暂无${category === 'labor' ? '人工' : '物料'}成本记录</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="cost-summary">
        <h4>${this.selectedYear}年${this.selectedMonth}月成本汇总</h4>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="label">人工成本</span>
            <span class="value">${this.formatCurrency(monthly.laborTotal)}</span>
          </div>
          <div class="stat-item">
            <span class="label">物料成本</span>
            <span class="value">${this.formatCurrency(monthly.materialTotal)}</span>
          </div>
          <div class="stat-item highlight">
            <span class="label">总成本</span>
            <span class="value">${this.formatCurrency(monthly.total)}</span>
          </div>
        </div>
      </div>
      ${costs.costs.map(c => {
        const itemName = category === 'labor'
          ? this.costManager.laborItems[c.item] || c.item
          : this.costManager.materialItems[c.item] || c.item;
        return `
          <div class="card cost-card">
            <div class="card-body">
              <div class="cost-header">
                <span class="item-name">${itemName}</span>
                <span class="amount">${this.formatCurrency(c.amount)}</span>
              </div>
              ${c.remark ? `<p class="remark">${c.remark}</p>` : ''}
              <button class="btn btn-sm btn-danger delete-cost" data-id="${c.id}">删除</button>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  updateCostItemOptions() {
    const category = document.getElementById('cost-category').value;
    const itemSelect = document.getElementById('cost-item');
    const items = category === 'labor'
      ? this.costManager.laborItems
      : this.costManager.materialItems;

    itemSelect.innerHTML = Object.entries(items).map(([key, value]) =>
      `<option value="${key}">${value}</option>`
    ).join('');
  }

  setupROIEvents() {
    const breakevenForm = document.getElementById('breakeven-roi-form');
    if (breakevenForm) {
      breakevenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBreakEvenROISubmit();
      });
    }

    const actualForm = document.getElementById('actual-roi-form');
    if (actualForm) {
      actualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleActualROISubmit();
      });
    }

    document.querySelectorAll('.roi-type-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.roi-type-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const type = e.target.dataset.type;
        this.showROITab(type);
      });
    });

    document.addEventListener('click', (e) => {
      if (e.target.matches('.delete-roi')) {
        const id = e.target.dataset.id;
        if (confirm('确定要删除这条ROI记录吗？')) {
          this.roiManager.deleteROIRecord(id);
          this.renderROIList();
          this.showToast('删除成功', 'success');
        }
      }
    });
  }

  showROITab(type) {
    document.querySelectorAll('.roi-form-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${type}-roi-section`).classList.add('active');
  }

  handleBreakEvenROISubmit() {
    const sellingPrice = document.getElementById('breakeven-selling-price').value;
    const costPrice = document.getElementById('breakeven-cost-price').value;
    const remark = document.getElementById('breakeven-remark').value;

    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      this.showToast('请输入有效的售价', 'error');
      return;
    }

    const result = this.roiManager.calculateBreakEvenROI(sellingPrice, costPrice);

    if (!result.valid) {
      this.showToast(result.message, 'error');
      return;
    }

    this.renderROIResult('breakeven', result);

    const record = {
      type: 'breakeven',
      sellingPrice: result.sellingPrice,
      costPrice: result.costPrice,
      calculatedROI: result.breakEvenROI,
      remark
    };
    this.roiManager.addROIRecord(record);
    this.showToast('保本ROI计算成功', 'success');
    this.renderROIList();
  }

  handleActualROISubmit() {
    const investment = document.getElementById('actual-investment').value;
    const revenue = document.getElementById('actual-revenue').value;
    const remark = document.getElementById('actual-remark').value;

    if (!investment || parseFloat(investment) <= 0) {
      this.showToast('请输入有效的投流费用', 'error');
      return;
    }

    if (revenue === '' || parseFloat(revenue) < 0) {
      this.showToast('请输入有效的实际收入', 'error');
      return;
    }

    const result = this.roiManager.calculateActualROI(investment, revenue);

    if (!result.valid) {
      this.showToast(result.message, 'error');
      return;
    }

    this.renderROIResult('actual', result);

    const record = {
      type: 'actual',
      investment: result.investment,
      revenue: result.revenue,
      actualROI: result.roi,
      remark
    };
    this.roiManager.addROIRecord(record);
    this.showToast('实际ROI计算成功', 'success');
    this.renderROIList();
  }

  renderROIResult(type, result) {
    const container = document.getElementById('roi-result');
    if (!container) return;

    container.classList.remove('hidden');

    if (type === 'breakeven') {
      container.innerHTML = `
        <div class="roi-result-card success">
          <h4>保本ROI计算结果</h4>
          <div class="result-grid">
            <div class="result-item">
              <span class="label">售价</span>
              <span class="value">${this.formatCurrency(result.sellingPrice)}</span>
            </div>
            <div class="result-item">
              <span class="label">成本价</span>
              <span class="value">${this.formatCurrency(result.costPrice)}</span>
            </div>
            <div class="result-item">
              <span class="label">毛利额</span>
              <span class="value">${this.formatCurrency(result.grossProfit)}</span>
            </div>
            <div class="result-item highlight">
              <span class="label">保本ROI</span>
              <span class="value">${result.breakEvenROI}%</span>
            </div>
          </div>
          <div class="result-status">
            <span class="status-badge">${result.status}</span>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="roi-result-card ${result.profit >= 0 ? 'success' : 'danger'}">
          <h4>实际ROI计算结果</h4>
          <div class="result-grid">
            <div class="result-item">
              <span class="label">投流费用</span>
              <span class="value">${this.formatCurrency(result.investment)}</span>
            </div>
            <div class="result-item">
              <span class="label">实际收入</span>
              <span class="value">${this.formatCurrency(result.revenue)}</span>
            </div>
            <div class="result-item ${result.profit >= 0 ? '' : 'negative'}">
              <span class="label">${result.profit >= 0 ? '盈利' : '亏损'}</span>
              <span class="value">${this.formatCurrency(Math.abs(result.profit))}</span>
            </div>
            <div class="result-item highlight">
              <span class="label">实际ROI</span>
              <span class="value">${result.roi}%</span>
            </div>
          </div>
          <div class="result-status">
            <span class="status-badge ${result.profit >= 0 ? 'success' : 'danger'}">${result.status}</span>
          </div>
        </div>
      `;
    }
  }

  renderROIList() {
    const container = document.getElementById('roi-records-list');
    if (!container) return;

    const records = this.roiManager.getAllROIRecords();

    if (records.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>暂无ROI记录</p>
          <p class="text-muted">计算后会显示在这里</p>
        </div>
      `;
      return;
    }

    container.innerHTML = records.map(r => `
      <div class="card roi-card">
        <div class="card-body">
          <div class="roi-header">
            <span class="type-badge ${r.type}">${r.type === 'breakeven' ? '保本ROI' : '实际ROI'}</span>
            <span class="date">${r.date}</span>
          </div>
          ${r.type === 'breakeven' ? `
            <div class="roi-details">
              <p>售价：${this.formatCurrency(r.sellingPrice)} | 成本：${this.formatCurrency(r.costPrice)}</p>
              <p class="highlight">保本ROI：${r.calculatedROI}%</p>
            </div>
          ` : `
            <div class="roi-details">
              <p>投流：${this.formatCurrency(r.investment)} | 收入：${this.formatCurrency(r.revenue)}</p>
              <p class="${r.actualROI >= 0 ? 'highlight' : 'negative'}">实际ROI：${r.actualROI}%</p>
            </div>
          `}
          ${r.remark ? `<p class="remark">${r.remark}</p>` : ''}
          <button class="btn btn-sm btn-danger delete-roi" data-id="${r.id}">删除</button>
        </div>
      </div>
    `).join('');
  }

  setupReportEvents() {
    document.querySelectorAll('.report-period-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.report-period-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const period = e.target.dataset.period;
        this.renderReport(period);
      });
    });
  }

  renderReport(period = 'monthly') {
    const container = document.getElementById('report-content');
    if (!container) return;

    if (period === 'monthly') {
      this.renderMonthlyReport(container);
    } else {
      this.renderYearlyReport(container);
    }
  }

  renderMonthlyReport(container) {
    const report = this.reportManager.generateMonthlyReport(this.selectedYear, this.selectedMonth);

    container.innerHTML = `
      <div class="report-header">
        <h2>${report.monthName}利润报表</h2>
        <div class="period-selector">
          <button class="btn btn-sm" onclick="app.changeMonth(-1)">上月</button>
          <span>${report.monthName}</span>
          <button class="btn btn-sm" onclick="app.changeMonth(1)">下月</button>
        </div>
      </div>

      <div class="report-section">
        <h3>一、收入情况</h3>
        <div class="report-stats">
          <div class="stat-card income">
            <div class="stat-value">${this.formatCurrency(report.income.total)}</div>
            <div class="stat-label">总收入</div>
          </div>
          <div class="stat-detail">
            <p>收入笔数: ${report.income.count}</p>
            ${Object.entries(report.income.breakdown).map(([key, val]) =>
              `<p>${val.categoryName}: ${this.formatCurrency(val.amount)}</p>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="report-section">
        <h3>二、支出情况</h3>
        <div class="report-stats">
          <div class="stat-card expense">
            <div class="stat-value">${this.formatCurrency(report.expense.total)}</div>
            <div class="stat-label">总支出</div>
          </div>
          <div class="stat-detail">
            <p>支出笔数: ${report.expense.count}</p>
            ${Object.entries(report.expense.breakdown).map(([key, val]) =>
              `<p>${val.categoryName}: ${this.formatCurrency(val.amount)}</p>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="report-section">
        <h3>三、成本情况</h3>
        <div class="report-stats">
          <div class="stat-card">
            <div class="stat-value">${this.formatCurrency(report.cost.total)}</div>
            <div class="stat-label">总成本</div>
          </div>
          <div class="stat-detail">
            <p>人工成本: ${this.formatCurrency(report.cost.labor)}</p>
            <p>物料成本: ${this.formatCurrency(report.cost.material)}</p>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h3>四、利润情况</h3>
        <div class="report-stats">
          <div class="stat-card ${report.profit.net >= 0 ? 'profit' : 'loss'}">
            <div class="stat-value">${this.formatCurrency(report.profit.net)}</div>
            <div class="stat-label">净利润</div>
          </div>
          <div class="stat-detail">
            <p>毛利润: ${this.formatCurrency(report.profit.gross)}</p>
            <p>利润率: ${report.profit.margin}%</p>
          </div>
        </div>
      </div>

      <div class="report-actions">
        <button class="btn btn-primary" onclick="app.downloadCurrentReport()">下载报表</button>
      </div>
    `;
  }

  renderYearlyReport(container) {
    const report = this.reportManager.generateYearlyReport(this.selectedYear);

    container.innerHTML = `
      <div class="report-header">
        <h2>${report.yearName}年度利润报表</h2>
        <div class="period-selector">
          <button class="btn btn-sm" onclick="app.changeYear(-1)">上一年</button>
          <span>${report.yearName}</span>
          <button class="btn btn-sm" onclick="app.changeYear(1)">下一年</button>
        </div>
      </div>

      <div class="report-section">
        <h3>年度汇总</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">总收入</span>
            <span class="value income">${this.formatCurrency(report.summary.income)}</span>
          </div>
          <div class="summary-item">
            <span class="label">总支出</span>
            <span class="value expense">${this.formatCurrency(report.summary.expense)}</span>
          </div>
          <div class="summary-item">
            <span class="label">人工成本</span>
            <span class="value">${this.formatCurrency(report.summary.labor)}</span>
          </div>
          <div class="summary-item">
            <span class="label">物料成本</span>
            <span class="value">${this.formatCurrency(report.summary.material)}</span>
          </div>
          <div class="summary-item">
            <span class="label">总成本</span>
            <span class="value">${this.formatCurrency(report.summary.costs)}</span>
          </div>
          <div class="summary-item">
            <span class="label">毛利润</span>
            <span class="value">${this.formatCurrency(report.summary.grossProfit)}</span>
          </div>
          <div class="summary-item highlight">
            <span class="label">净利润</span>
            <span class="value">${this.formatCurrency(report.summary.netProfit)}</span>
          </div>
          <div class="summary-item highlight">
            <span class="label">利润率</span>
            <span class="value">${report.summary.profitMargin}%</span>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h3>月度明细</h3>
        <div class="monthly-table">
          <table>
            <thead>
              <tr>
                <th>月份</th>
                <th>收入</th>
                <th>支出</th>
                <th>成本</th>
                <th>利润</th>
              </tr>
            </thead>
            <tbody>
              ${report.monthlyReports.map(month => `
                <tr>
                  <td>${month.monthName}</td>
                  <td class="income">${this.formatCurrency(month.income.total)}</td>
                  <td class="expense">${this.formatCurrency(month.expense.total)}</td>
                  <td>${this.formatCurrency(month.cost.total)}</td>
                  <td class="${month.profit.net >= 0 ? 'profit' : 'loss'}">${this.formatCurrency(month.profit.net)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="report-actions">
        <button class="btn btn-primary" onclick="app.downloadYearlyReport()">下载年报</button>
      </div>
    `;
  }

  changeMonth(delta) {
    this.selectedMonth += delta;
    if (this.selectedMonth > 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else if (this.selectedMonth < 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    }
    this.renderReport('monthly');
  }

  changeYear(delta) {
    this.selectedYear += delta;
    this.renderReport('yearly');
  }

  downloadCurrentReport() {
    this.reportManager.downloadMonthlyReport(this.selectedYear, this.selectedMonth);
  }

  downloadYearlyReport() {
    this.reportManager.downloadYearlyReport(this.selectedYear);
  }

  setupSettingsEvents() {
    document.getElementById('export-data')?.addEventListener('click', () => {
      const data = this.storage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `财务数据备份_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      this.showToast('数据导出成功', 'success');
    });

    document.getElementById('import-data')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (confirm('导入数据将覆盖现有数据，是否继续？')) {
              this.storage.importData(data);
              this.showToast('数据导入成功', 'success');
              this.renderCurrentPage();
            }
          } catch (err) {
            this.showToast('文件格式错误', 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });

    document.getElementById('clear-data')?.addEventListener('click', () => {
      if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        if (confirm('再次确认：所有数据将被永久删除！')) {
          this.storage.clearAllData();
          this.showToast('数据已清空', 'success');
          this.renderCurrentPage();
        }
      }
    });
  }

  renderCurrentPage() {
    switch (this.currentPage) {
      case 'home':
        this.renderHomePage();
        break;
      case 'records':
        this.renderRecordsPage();
        break;
      case 'reports':
        this.renderReport('monthly');
        break;
      case 'settings':
        this.renderSettingsPage();
        break;
    }
  }

  renderHomePage() {
    const dashboard = this.reportManager.getDashboardData();

    document.getElementById('home-income').textContent = this.formatCurrency(dashboard.summary.totalIncome);
    document.getElementById('home-expense').textContent = this.formatCurrency(dashboard.summary.totalExpense);
    document.getElementById('home-costs').textContent = this.formatCurrency(dashboard.summary.totalCosts);
    document.getElementById('home-profit').textContent = this.formatCurrency(dashboard.summary.netProfit);
    document.getElementById('home-profit-margin').textContent = `${dashboard.summary.profitMargin}%`;

    const profitEl = document.getElementById('home-profit');
    profitEl.className = dashboard.summary.netProfit >= 0 ? 'highlight' : 'loss';

    this.renderQuickActions();
    this.renderRecentTransactions();
  }

  renderQuickActions() {
    const container = document.getElementById('quick-actions');
    if (!container) return;

    container.innerHTML = `
      <button class="quick-action-btn" onclick="app.navigateTo('records'); app.setTab('transaction'); app.updateCategoryOptions();">
        <span class="icon">💰</span>
        <span>快速记收入</span>
      </button>
      <button class="quick-action-btn" onclick="app.navigateTo('records'); app.setTab('transaction'); document.getElementById('transaction-type').value='expense'; app.updateCategoryOptions();">
        <span class="icon">📤</span>
        <span>快速记支出</span>
      </button>
      <button class="quick-action-btn" onclick="app.navigateTo('records'); app.setTab('product');">
        <span class="icon">🧮</span>
        <span>毛利率计算</span>
      </button>
    `;
  }

  renderRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    if (!container) return;

    const transactions = this.transactionManager.getRecentTransactions(5);

    if (transactions.length === 0) {
      container.innerHTML = '<p class="text-muted">暂无最近记录</p>';
      return;
    }

    container.innerHTML = transactions.map(t => `
      <div class="recent-item">
        <div>
          <span class="category">${this.transactionManager.getCategoryName(t.type, t.category)}</span>
          <span class="date">${t.date}</span>
        </div>
        <span class="amount ${t.type === 'income' ? 'income' : 'expense'}">
          ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
        </span>
      </div>
    `).join('');
  }

  renderRecordsPage() {
    this.updateCategoryOptions();
    this.updateCostItemOptions();
    this.renderProducts();
    this.renderTransactionList('income');
    this.renderCostList('labor');
  }

  setTab(tab) {
    this.currentTab = tab;
  }

  renderSettingsPage() {
  }

  formatCurrency(amount) {
    return '¥' + parseFloat(amount || 0).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

window.FinanceApp = FinanceApp;

document.addEventListener('DOMContentLoaded', () => {
  window.app = new FinanceApp();
});

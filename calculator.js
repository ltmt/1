/**
 * 毛利率计算器模块
 * 负责商品毛利率计算和盈亏平衡点分析
 */

class Calculator {
  constructor(storageManager) {
    this.storage = storageManager;
  }

  calculateGrossMargin(costPrice, sellingPrice) {
    if (!sellingPrice || sellingPrice === 0) {
      return 0;
    }
    const margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
    return Math.max(0, margin);
  }

  calculateGrossProfit(costPrice, sellingPrice) {
    return sellingPrice - costPrice;
  }

  calculateBreakEvenPoint(fixedCosts, unitPrice, unitCost) {
    const unitProfit = unitPrice - unitCost;
    if (unitProfit <= 0) {
      return { quantity: Infinity, revenue: Infinity, message: '单位利润为负，无法达到盈亏平衡' };
    }
    const quantity = Math.ceil(fixedCosts / unitProfit);
    const revenue = quantity * unitPrice;
    return {
      quantity,
      revenue,
      message: ''
    };
  }

  addProduct(name, costPrice, sellingPrice) {
    const cost = parseFloat(costPrice) || 0;
    const price = parseFloat(sellingPrice) || 0;
    const grossMargin = this.calculateGrossMargin(cost, price);
    const grossProfit = this.calculateGrossProfit(cost, price);

    const product = {
      name: name.trim(),
      costPrice: cost,
      sellingPrice: price,
      grossMargin: grossMargin.toFixed(2),
      grossProfit: grossProfit.toFixed(2)
    };

    return this.storage.saveProduct(product);
  }

  updateProduct(id, name, costPrice, sellingPrice) {
    const cost = parseFloat(costPrice) || 0;
    const price = parseFloat(sellingPrice) || 0;
    const grossMargin = this.calculateGrossMargin(cost, price);
    const grossProfit = this.calculateGrossProfit(cost, price);

    const product = {
      id,
      name: name.trim(),
      costPrice: cost,
      sellingPrice: price,
      grossMargin: grossMargin.toFixed(2),
      grossProfit: grossProfit.toFixed(2)
    };

    return this.storage.saveProduct(product);
  }

  getAllProducts() {
    return this.storage.getProducts();
  }

  deleteProduct(id) {
    return this.storage.deleteProduct(id);
  }

  searchProducts(keyword) {
    const products = this.getAllProducts();
    if (!keyword || keyword.trim() === '') {
      return products;
    }
    const lowerKeyword = keyword.toLowerCase().trim();
    return products.filter(p =>
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.costPrice.toString().includes(lowerKeyword) ||
      p.sellingPrice.toString().includes(lowerKeyword)
    );
  }

  getProductStats() {
    const products = this.getAllProducts();
    if (products.length === 0) {
      return {
        count: 0,
        avgMargin: 0,
        highestMargin: 0,
        lowestMargin: 0
      };
    }

    const margins = products.map(p => parseFloat(p.grossMargin));
    const avgMargin = margins.reduce((sum, m) => sum + m, 0) / margins.length;
    const highestMargin = Math.max(...margins);
    const lowestMargin = Math.min(...margins);

    return {
      count: products.length,
      avgMargin: avgMargin.toFixed(2),
      highestMargin: highestMargin.toFixed(2),
      lowestMargin: lowestMargin.toFixed(2)
    };
  }

  calculateSingleProduct(costPrice, sellingPrice) {
    const cost = parseFloat(costPrice) || 0;
    const price = parseFloat(sellingPrice) || 0;

    if (price <= 0) {
      return {
        valid: false,
        message: '售价必须大于0'
      };
    }

    if (cost < 0 || price < 0) {
      return {
        valid: false,
        message: '价格不能为负数'
      };
    }

    const grossMargin = this.calculateGrossMargin(cost, price);
    const grossProfit = this.calculateGrossProfit(cost, price);

    let status = '亏损';
    if (grossProfit === 0) {
      status = '保本';
    } else if (grossMargin >= 30) {
      status = '高利润';
    } else if (grossMargin >= 15) {
      status = '正常利润';
    } else if (grossMargin > 0) {
      status = '低利润';
    }

    return {
      valid: true,
      costPrice: cost,
      sellingPrice: price,
      grossMargin: grossMargin.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      status
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
}

window.Calculator = Calculator;

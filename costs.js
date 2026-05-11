/**
 * 成本统计模块
 * 负责人工成本和物料成本的统计管理
 */

class CostManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.laborItems = {
      wages: '员工工资',
      social_security: '社保公积金',
      bonus: '奖金提成',
      recruitment: '招聘培训费',
      other_labor: '其他人工费用'
    };

    this.materialItems = {
      raw_materials: '原材料采购',
      office_supplies: '办公用品',
      packaging: '包装材料',
      shipping: '运输费',
      other_material: '其他物料费用'
    };
  }

  addCost(category, item, amount, month, remark = '') {
    const cost = {
      category,
      item,
      amount: parseFloat(amount) || 0,
      month: month || this.getCurrentMonth(),
      remark: remark.trim()
    };

    if (cost.amount <= 0) {
      return { success: false, message: '金额必须大于0' };
    }

    this.storage.saveCost(cost);
    return { success: true, message: '成本记录成功', data: cost };
  }

  updateCost(id, category, item, amount, month, remark = '') {
    const cost = {
      id,
      category,
      item,
      amount: parseFloat(amount) || 0,
      month,
      remark: remark.trim()
    };

    if (cost.amount <= 0) {
      return { success: false, message: '金额必须大于0' };
    }

    this.storage.saveCost(cost);
    return { success: true, message: '更新成功', data: cost };
  }

  deleteCost(id) {
    this.storage.deleteCost(id);
    return { success: true, message: '删除成功' };
  }

  getCostsByMonth(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return this.storage.getCosts({ month: monthStr });
  }

  getMonthlyCosts(year, month) {
    const costs = this.getCostsByMonth(year, month);

    const laborCosts = costs.filter(c => c.category === 'labor');
    const materialCosts = costs.filter(c => c.category === 'material');

    const laborTotal = laborCosts.reduce((sum, c) => sum + c.amount, 0);
    const materialTotal = materialCosts.reduce((sum, c) => sum + c.amount, 0);
    const totalCosts = laborTotal + materialTotal;

    return {
      year,
      month,
      laborCosts,
      materialCosts,
      laborTotal,
      materialTotal,
      total: totalCosts,
      count: costs.length
    };
  }

  getLaborCosts(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const costs = this.storage.getCosts({ month: monthStr, category: 'labor' });

    const breakdown = {};
    let total = 0;

    costs.forEach(c => {
      if (!breakdown[c.item]) {
        breakdown[c.item] = {
          itemName: this.laborItems[c.item] || c.item,
          amount: 0,
          count: 0
        };
      }
      breakdown[c.item].amount += c.amount;
      breakdown[c.item].count++;
      total += c.amount;
    });

    return {
      costs,
      breakdown,
      total,
      itemCount: Object.keys(breakdown).length
    };
  }

  getMaterialCosts(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const costs = this.storage.getCosts({ month: monthStr, category: 'material' });

    const breakdown = {};
    let total = 0;

    costs.forEach(c => {
      if (!breakdown[c.item]) {
        breakdown[c.item] = {
          itemName: this.materialItems[c.item] || c.item,
          amount: 0,
          count: 0
        };
      }
      breakdown[c.item].amount += c.amount;
      breakdown[c.item].count++;
      total += c.amount;
    });

    return {
      costs,
      breakdown,
      total,
      itemCount: Object.keys(breakdown).length
    };
  }

  calculateCostRatio(year, month) {
    const laborData = this.getLaborCosts(year, month);
    const materialData = this.getMaterialCosts(year, month);

    const totalCosts = laborData.total + materialData.total;

    if (totalCosts === 0) {
      return {
        laborRatio: 0,
        materialRatio: 0,
        laborTotal: 0,
        materialTotal: 0,
        total: 0
      };
    }

    return {
      laborRatio: (laborData.total / totalCosts * 100).toFixed(2),
      materialRatio: (materialData.total / totalCosts * 100).toFixed(2),
      laborTotal: laborData.total,
      materialTotal: materialData.total,
      total: totalCosts
    };
  }

  getYearlyCosts(year) {
    const costs = this.storage.getCosts({ year: year.toString() });

    const monthlyData = {};
    let totalLabor = 0;
    let totalMaterial = 0;

    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const monthCosts = costs.filter(c => c.month === monthStr);

      const laborCosts = monthCosts.filter(c => c.category === 'labor');
      const materialCosts = monthCosts.filter(c => c.category === 'material');

      const laborTotal = laborCosts.reduce((sum, c) => sum + c.amount, 0);
      const materialTotal = materialCosts.reduce((sum, c) => sum + c.amount, 0);

      monthlyData[month] = {
        month: monthStr,
        monthName: `${month}月`,
        laborTotal,
        materialTotal,
        total: laborTotal + materialTotal
      };

      totalLabor += laborTotal;
      totalMaterial += materialTotal;
    }

    return {
      year,
      monthlyData,
      totalLabor,
      totalMaterial,
      totalCosts: totalLabor + totalMaterial
    };
  }

  compareMonths(currentYear, currentMonth, previousYear, previousMonth) {
    const current = this.monthlyCosts(currentYear, currentMonth);
    const previous = this.monthlyCosts(previousYear, previousMonth);

    const laborChange = current.laborTotal - previous.laborTotal;
    const materialChange = current.materialTotal - previous.materialTotal;
    const totalChange = current.total - previous.total;

    const laborPercent = previous.laborTotal > 0
      ? ((current.laborTotal - previous.laborTotal) / previous.laborTotal * 100)
      : 0;
    const materialPercent = previous.materialTotal > 0
      ? ((current.materialTotal - previous.materialTotal) / previous.materialTotal * 100)
      : 0;
    const totalPercent = previous.total > 0
      ? ((current.total - previous.total) / previous.total * 100)
      : 0;

    return {
      current,
      previous,
      laborChange,
      materialChange,
      totalChange,
      laborPercent: laborPercent.toFixed(1),
      materialPercent: materialPercent.toFixed(1),
      totalPercent: totalPercent.toFixed(1),
      laborTrend: laborChange >= 0 ? 'up' : 'down',
      materialTrend: materialChange >= 0 ? 'up' : 'down',
      totalTrend: totalChange >= 0 ? 'up' : 'down'
    };
  }

  getTopCostItems(year, month, limit = 5) {
    const costs = this.getCostsByMonth(year, month);

    return costs
      .map(c => ({
        ...c,
        itemName: c.category === 'labor'
          ? this.laborItems[c.item] || c.item
          : this.materialItems[c.item] || c.item
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  getAllCostItems() {
    return {
      labor: this.laborItems,
      material: this.materialItems
    };
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

  exportToCSV(year, month) {
    const costs = this.getCostsByMonth(year, month);
    const headers = ['月份', '类别', '成本项', '金额', '备注', '创建时间'];
    const rows = costs.map(c => [
      c.month,
      c.category === 'labor' ? '人工成本' : '物料成本',
      c.category === 'labor'
        ? this.laborItems[c.item] || c.item
        : this.materialItems[c.item] || c.item,
      c.amount,
      c.remark,
      c.createdAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  downloadCSV(year, month) {
    const csv = this.exportToCSV(year, month);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `成本记录_${year}年${month}月.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getSummary() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthly = this.monthlyCosts(year, month);
    const yearly = this.getYearlyCosts(year);

    return {
      currentMonth: monthly,
      currentYear: yearly,
      laborItems: Object.keys(this.laborItems),
      materialItems: Object.keys(this.materialItems)
    };
  }

  monthlyCosts(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const costs = this.storage.getCosts({ month: monthStr });

    const laborCosts = costs.filter(c => c.category === 'labor');
    const materialCosts = costs.filter(c => c.category === 'material');

    return {
      month: monthStr,
      laborCosts,
      materialCosts,
      laborTotal: laborCosts.reduce((sum, c) => sum + c.amount, 0),
      materialTotal: materialCosts.reduce((sum, c) => sum + c.amount, 0),
      total: costs.reduce((sum, c) => sum + c.amount, 0)
    };
  }
}

window.CostManager = CostManager;

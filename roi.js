/**
 * ROI（投入产出比）计算模块
 * 负责计算保本ROI和实际ROI
 */

class ROIManager {
  constructor(storageManager, calculator) {
    this.storage = storageManager;
    this.calculator = calculator;
  }

  calculateBreakEvenROI(sellingPrice, costPrice = 0) {
    if (!sellingPrice || sellingPrice <= 0) {
      return {
        valid: false,
        message: '售价必须大于0'
      };
    }

    if (costPrice < 0) {
      return {
        valid: false,
        message: '成本价不能为负数'
      };
    }

    if (costPrice > sellingPrice) {
      return {
        valid: false,
        message: '成本价不能大于售价'
      };
    }

    const grossProfit = sellingPrice - costPrice;
    const breakEvenROI = costPrice > 0 ? ((sellingPrice - costPrice) / costPrice * 100) : 100;

    let status = '';
    if (breakEvenROI >= 300) {
      status = '优秀';
    } else if (breakEvenROI >= 100) {
      status = '良好';
    } else if (breakEvenROI >= 50) {
      status = '一般';
    } else {
      status = '较低';
    }

    return {
      valid: true,
      sellingPrice,
      costPrice,
      grossProfit,
      breakEvenROI: breakEvenROI.toFixed(2),
      status,
      message: ''
    };
  }

  calculateActualROI(investment, revenue) {
    if (!investment || investment <= 0) {
      return {
        valid: false,
        message: '投流费用必须大于0'
      };
    }

    if (revenue < 0) {
      return {
        valid: false,
        message: '实际收入不能为负数'
      };
    }

    const profit = revenue - investment;
    const roi = (profit / investment) * 100;
    const roas = revenue / investment;

    let status = '';
    if (roi >= 100) {
      status = '盈利优秀';
    } else if (roi >= 50) {
      status = '盈利良好';
    } else if (roi >= 0) {
      status = '微利';
    } else if (roi >= -50) {
      status = '亏损';
    } else {
      status = '严重亏损';
    }

    return {
      valid: true,
      investment,
      revenue,
      profit,
      roi: roi.toFixed(2),
      roas: roas.toFixed(2),
      status,
      message: ''
    };
  }

  calculateBreakEvenRevenue(investment, targetROI) {
    if (!investment || investment <= 0) {
      return {
        valid: false,
        message: '投流费用必须大于0'
      };
    }

    if (targetROI < 0) {
      return {
        valid: false,
        message: '目标ROI不能为负数'
      };
    }

    const targetProfit = investment * (targetROI / 100);
    const breakEvenRevenue = investment + targetProfit;

    return {
      valid: true,
      investment,
      targetROI,
      targetProfit,
      breakEvenRevenue,
      message: ''
    };
  }

  calculateBreakEvenInvestment(revenue, targetROI) {
    if (!revenue || revenue <= 0) {
      return {
        valid: false,
        message: '预期收入必须大于0'
      };
    }

    if (targetROI < 0) {
      return {
        valid: false,
        message: '目标ROI不能为负数'
      };
    }

    const breakEvenInvestment = revenue / (1 + targetROI / 100);

    return {
      valid: true,
      revenue,
      targetROI,
      breakEvenInvestment,
      maxProfit: revenue - breakEvenInvestment,
      message: ''
    };
  }

  addROIRecord(record) {
    const roiRecord = {
      type: record.type,
      sellingPrice: parseFloat(record.sellingPrice) || 0,
      costPrice: parseFloat(record.costPrice) || 0,
      investment: parseFloat(record.investment) || 0,
      revenue: parseFloat(record.revenue) || 0,
      calculatedROI: parseFloat(record.calculatedROI) || 0,
      actualROI: parseFloat(record.actualROI) || 0,
      remark: record.remark || '',
      date: record.date || this.formatDate(new Date())
    };

    return this.storage.saveROIRecord(roiRecord);
  }

  getAllROIRecords() {
    return this.storage.getROIRecords();
  }

  getROIRecordsByDate(startDate, endDate) {
    return this.storage.getROIRecords({ startDate, endDate });
  }

  deleteROIRecord(id) {
    return this.storage.deleteROIRecord(id);
  }

  getROIStats(period = 'month') {
    const records = this.getAllROIRecords();
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

    const filteredRecords = records.filter(r => r.date >= startDate && r.date <= endDate);

    const breakEvenRecords = filteredRecords.filter(r => r.type === 'breakeven');
    const actualRecords = filteredRecords.filter(r => r.type === 'actual');

    const avgBreakEvenROI = breakEvenRecords.length > 0
      ? breakEvenRecords.reduce((sum, r) => sum + r.calculatedROI, 0) / breakEvenRecords.length
      : 0;

    const avgActualROI = actualRecords.length > 0
      ? actualRecords.reduce((sum, r) => sum + r.actualROI, 0) / actualRecords.length
      : 0;

    const totalInvestment = actualRecords.reduce((sum, r) => sum + r.investment, 0);
    const totalRevenue = actualRecords.reduce((sum, r) => sum + r.revenue, 0);
    const overallROI = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment * 100) : 0;

    return {
      period,
      startDate,
      endDate,
      totalRecords: filteredRecords.length,
      breakEvenRecords: breakEvenRecords.length,
      actualRecords: actualRecords.length,
      avgBreakEvenROI: avgBreakEvenROI.toFixed(2),
      avgActualROI: avgActualROI.toFixed(2),
      totalInvestment,
      totalRevenue,
      overallROI: overallROI.toFixed(2),
      profit: totalRevenue - totalInvestment
    };
  }

  formatCurrency(amount) {
    return '¥' + parseFloat(amount || 0).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatPercentage(value) {
    return parseFloat(value || 0).toFixed(2) + '%';
  }

  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  exportToCSV() {
    const records = this.getAllROIRecords();
    const headers = ['日期', '类型', '售价', '成本价', '投流费用', '实际收入', '计算ROI', '实际ROI', '备注'];
    const rows = records.map(r => [
      r.date,
      r.type === 'breakeven' ? '保本ROI' : '实际ROI',
      r.sellingPrice,
      r.costPrice,
      r.investment,
      r.revenue,
      r.calculatedROI,
      r.actualROI,
      r.remark
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
    link.setAttribute('download', `ROI记录_${this.formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.ROIManager = ROIManager;

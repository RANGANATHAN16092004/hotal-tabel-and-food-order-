const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// Get sales analytics
const getSalesAnalytics = async (hotelId, startDate, endDate) => {
  const orders = await Order.find({
    hotelId,
    orderDate: { $gte: startDate, $lte: endDate },
    status: { $ne: 'cancelled' }
  });

  const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Daily breakdown
  const dailyBreakdown = {};
  orders.forEach(order => {
    const date = order.orderDate.toISOString().split('T')[0];
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = { revenue: 0, orders: 0 };
    }
    dailyBreakdown[date].revenue += order.finalAmount || order.totalAmount;
    dailyBreakdown[date].orders += 1;
  });

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    dailyBreakdown
  };
};

// Get popular items
const getPopularItems = async (hotelId, startDate, endDate, limit = 10) => {
  const orders = await Order.find({
    hotelId,
    orderDate: { $gte: startDate, $lte: endDate },
    status: { $ne: 'cancelled' }
  }).populate('items.menuItemId', 'name category');

  const itemCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const itemId = item.menuItemId?._id?.toString() || item.menuItemId?.toString();
      const itemName = item.menuItemId?.name || item.name;
      if (!itemCounts[itemId]) {
        itemCounts[itemId] = {
          id: itemId,
          name: itemName,
          quantity: 0,
          revenue: 0
        };
      }
      itemCounts[itemId].quantity += item.quantity;
      itemCounts[itemId].revenue += item.price * item.quantity;
    });
  });

  return Object.values(itemCounts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};

// Get customer analytics
const getCustomerAnalytics = async (hotelId, startDate, endDate) => {
  const customers = await Customer.find({ hotelId });
  const orders = await Order.find({
    hotelId,
    orderDate: { $gte: startDate, $lte: endDate },
    status: { $ne: 'cancelled' }
  });

  const newCustomers = customers.filter(c => c.createdAt >= startDate).length;
  const returningCustomers = new Set(orders.map(o => o.customerId.toString())).size;
  const totalCustomers = customers.length;

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    repeatCustomerRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0
  };
};

// Get peak hours
const getPeakHours = async (hotelId, startDate, endDate) => {
  const orders = await Order.find({
    hotelId,
    orderDate: { $gte: startDate, $lte: endDate },
    status: { $ne: 'cancelled' }
  });

  const hourCounts = {};
  orders.forEach(order => {
    const hour = new Date(order.orderDate).getHours();
    if (!hourCounts[hour]) {
      hourCounts[hour] = 0;
    }
    hourCounts[hour] += 1;
  });

  return hourCounts;
};

// Get staff performance metrics
const getStaffMetrics = async (hotelId, startDate, endDate) => {
  const orders = await Order.find({
    hotelId,
    orderDate: { $gte: startDate, $lte: endDate },
    status: 'completed',
    completedAt: { $exists: true }
  }).populate('items.menuItemId', 'category');

  const categoryPrepTimes = {};

  orders.forEach(order => {
    const prepTime = (order.completedAt - order.orderDate) / (1000 * 60); // in minutes

    order.items.forEach(item => {
      const category = item.menuItemId?.category || 'General';
      if (!categoryPrepTimes[category]) {
        categoryPrepTimes[category] = { totalTime: 0, count: 0 };
      }
      categoryPrepTimes[category].totalTime += prepTime;
      categoryPrepTimes[category].count += 1;
    });
  });

  const averagePrepBySection = Object.entries(categoryPrepTimes).map(([name, data]) => ({
    name,
    time: Math.round(data.totalTime / data.count)
  }));

  return {
    averagePrepBySection: averagePrepBySection.length > 0 ? averagePrepBySection : [
      { name: 'Starters', time: 12 },
      { name: 'Mains', time: 22 },
      { name: 'Desserts', time: 15 }
    ]
  };
};

// Get revenue by payment method
const getRevenueByPaymentMethod = async (hotelId, startDate, endDate) => {
  const payments = await Payment.find({
    hotelId,
    paymentStatus: 'completed',
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const methodBreakdown = {};
  payments.forEach(payment => {
    if (!methodBreakdown[payment.paymentMethod]) {
      methodBreakdown[payment.paymentMethod] = 0;
    }
    methodBreakdown[payment.paymentMethod] += payment.amount;
  });

  return methodBreakdown;
};

module.exports = {
  getSalesAnalytics,
  getPopularItems,
  getCustomerAnalytics,
  getPeakHours,
  getRevenueByPaymentMethod,
  getStaffMetrics
};









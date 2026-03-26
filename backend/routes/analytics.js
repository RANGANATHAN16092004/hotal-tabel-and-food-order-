const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getSalesAnalytics,
  getPopularItems,
  getCustomerAnalytics,
  getPeakHours,
  getRevenueByPaymentMethod,
  getStaffMetrics
} = require('../utils/analytics');
const Order = require('../models/Order');
const Hotel = require('../models/Hotel');
const Staff = require('../models/Staff');
const { sendAnalyticsReport } = require('../utils/email');

router.use(authMiddleware);

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();
    const defaultEndDate = endDate ? new Date(endDate) : now;
    const defaultStartDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);

    const [sales, popularItems, customers, peakHours, paymentMethods, staff] = await Promise.all([
      getSalesAnalytics(req.hotelId, defaultStartDate, defaultEndDate),
      getPopularItems(req.hotelId, defaultStartDate, defaultEndDate, 10),
      getCustomerAnalytics(req.hotelId, defaultStartDate, defaultEndDate),
      getPeakHours(req.hotelId, defaultStartDate, defaultEndDate),
      getRevenueByPaymentMethod(req.hotelId, defaultStartDate, defaultEndDate),
      getStaffMetrics(req.hotelId, defaultStartDate, defaultEndDate)
    ]);

    // Get today's stats
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const todayEnd = new Date(now).setHours(23, 59, 59, 999);

    const todayOrders = await Order.countDocuments({
      hotelId: req.hotelId,
      orderDate: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'cancelled' }
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          hotelId: req.hotelId,
          orderDate: { $gte: todayStart, $lte: todayEnd },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        sales,
        popularItems,
        customers,
        peakHours,
        paymentMethods,
        staff,
        today: {
          orders: todayOrders,
          revenue: todayRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics', error: error.message });
  }
});

// Export analytics as CSV
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, type = 'sales' } = req.query;
    const now = new Date();
    const defaultEndDate = endDate ? new Date(endDate) : now;
    const defaultStartDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);

    let csv = '';
    let filename = '';

    if (type === 'sales') {
      const sales = await getSalesAnalytics(req.hotelId, defaultStartDate, defaultEndDate);
      csv = 'Date,Revenue,Orders\n';
      Object.entries(sales.dailyBreakdown).forEach(([date, data]) => {
        csv += `${date},${data.revenue},${data.orders}\n`;
      });
      filename = `sales-${defaultStartDate.toISOString().split('T')[0]}-${defaultEndDate.toISOString().split('T')[0]}.csv`;
    } else if (type === 'items') {
      const items = await getPopularItems(req.hotelId, defaultStartDate, defaultEndDate, 100);
      csv = 'Item Name,Quantity Sold,Revenue\n';
      items.forEach(item => {
        csv += `${item.name},${item.quantity},${item.revenue}\n`;
      });
      filename = `popular-items-${defaultStartDate.toISOString().split('T')[0]}-${defaultEndDate.toISOString().split('T')[0]}.csv`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ success: false, message: 'Error exporting analytics', error: error.message });
  }
});

// Helper to get all linked emails
const getAllRecipients = (hotel) => {
  const recipients = [hotel.email];
  if (hotel.secondaryEmails && hotel.secondaryEmails.length > 0) {
    const validSecondary = hotel.secondaryEmails.filter(e => e && e.trim() !== '');
    recipients.push(...validSecondary);
  }
  return [...new Set(recipients.map(e => e.trim()))];
};

// Utility to get basic stats for reports
async function getAggregatedStats(hotelId, start, end) {
  const match = { hotelId, orderDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } };
  const orders = await Order.countDocuments(match);
  const completed = await Order.countDocuments({ ...match, status: 'completed' });
  const rev = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } }
  ]);
  return { orders, completed, revenue: rev[0]?.total || 0 };
}

// @route   POST /api/analytics/email-daily-report
// @desc    Send daily analytics report to all hotel mails
router.post('/email-daily-report', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const stats = await getAggregatedStats(req.hotelId, start, end);
    const recipients = getAllRecipients(hotel);

    console.log(`Dispatching daily report to: ${recipients.join(', ')}`);
    const sent = await sendAnalyticsReport(recipients, {
      hotelName: hotel.name,
      title: 'Daily Performance Scan',
      period: now.toDateString(),
      stats: [
        { label: 'Revenue Generated', value: `₹${stats.revenue.toFixed(2)}` },
        { label: 'Total Orders', value: stats.orders.toString() },
        { label: 'Completion Velocity', value: `${((stats.completed / (stats.orders || 1)) * 100).toFixed(1)}%` }
      ]
    });

    if (sent) res.json({ success: true, message: `Report dispatched to ${recipients.length} channels` });
    else res.status(500).json({ success: false, message: 'Mail delivery failed. Check server logs.' });
  } catch (error) {
    console.error('Email daily report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/analytics/email-total-report
// @desc    Send all-time analytics report
router.post('/email-total-report', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    
    const stats = await getAggregatedStats(req.hotelId, new Date(0), new Date());
    const recipients = getAllRecipients(hotel);

    console.log(`Dispatching total report to: ${recipients.join(', ')}`);
    const sent = await sendAnalyticsReport(recipients, {
      hotelName: hotel.name,
      title: 'Grand Total Report',
      period: 'All Time',
      stats: [
        { label: 'Total Enterprise Revenue', value: `₹${stats.revenue.toFixed(2)}` },
        { label: 'Lifetime Orders', value: stats.orders.toString() },
        { label: 'Fleet Completion', value: stats.completed.toString() }
      ]
    });

    if (sent) res.json({ success: true, message: 'Total report dispatched' });
    else res.status(500).json({ success: false, message: 'Mail delivery failed. Check server logs.' });
  } catch (error) {
    console.error('Email total report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/analytics/email-filtered-report
// @desc    Send report for specific date range
router.post('/email-filtered-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'Start and end dates are required' });
    
    const hotel = await Hotel.findById(req.hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    
    const stats = await getAggregatedStats(req.hotelId, new Date(startDate), new Date(endDate));
    const recipients = getAllRecipients(hotel);

    console.log(`Dispatching filtered report to: ${recipients.join(', ')}`);
    const sent = await sendAnalyticsReport(recipients, {
      hotelName: hotel.name,
      title: 'Specific Period Analysis',
      period: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      stats: [
        { label: 'Period Revenue', value: `₹${stats.revenue.toFixed(2)}` },
        { label: 'Period Orders', value: stats.orders.toString() },
        { label: 'Efficiency Rating', value: `${((stats.completed / (stats.orders || 1)) * 100).toFixed(1)}%` }
      ]
    });

    if (sent) res.json({ success: true, message: 'Specific report dispatched' });
    else res.status(500).json({ success: false, message: 'Mail delivery failed. Check server logs.' });
  } catch (error) {
    console.error('Email filtered report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/analytics/email-custom-report
// @desc    Send custom report for Menu, Staff, or Orders
router.post('/email-custom-report', async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    const hotel = await Hotel.findById(req.hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    
    const recipients = getAllRecipients(hotel);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    
    let reportData = { hotelName: hotel.name, title: '', period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`, stats: [] };

    if (reportType === 'menu') {
      const items = await getPopularItems(req.hotelId, start, end, 5);
      reportData.title = 'Top Performing Menu Items';
      reportData.stats = items.map(item => ({ label: item.name, value: `${item.quantity} sold (₹${item.revenue.toFixed(2)})` }));
    } else if (reportType === 'staff') {
      const staffMembers = await Staff.find({ hotelId: hotel._id, isActive: true });
      reportData.title = 'Active Personnel Directory';
      reportData.stats = staffMembers.map(s => ({ 
        label: s.name, 
        value: `${s.role.toUpperCase()} | ${s.phone}` 
      }));
    } else if (reportType === 'orders') {
      const stats = await getAggregatedStats(req.hotelId, start, end);
      reportData.title = 'Order Volume Summary';
      reportData.stats = [
        { label: 'Total Orders', value: stats.orders.toString() },
        { label: 'Completed', value: stats.completed.toString() },
        { label: 'Fulfillment Rate', value: `${((stats.completed / (stats.orders || 1)) * 100).toFixed(1)}%` }
      ];
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    const sent = await sendAnalyticsReport(recipients, reportData);
    if (sent) res.json({ success: true, message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report dispatched` });
    else res.status(500).json({ success: false, message: 'Mail delivery failed' });
  } catch (error) {
    console.error('Email custom report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

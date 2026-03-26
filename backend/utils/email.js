const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Restaurant Booking System" <noreply@restaurant.com>',
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendOTP = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
      <h2>Your Login OTP</h2>
      <p>Use the following OTP to log in to your hotel admin dashboard. It is valid for 10 minutes.</p>
      <h1 style="color: #4A90E2; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Your Login OTP', html });
};

const sendDailyAnalytics = async (email, analyticsData) => {
  const { date, totalOrders, totalEarnings, completedOrders, hotelName } = analyticsData;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
      <h1 style="color: #1a1a1a; font-size: 20px; text-transform: uppercase;">${hotelName || 'Establishment'}</h1>
      <h2 style="color: #4A90E2; border-top: 1px solid #f0f0f0; padding-top: 15px;">Daily Analytics Report - ${date}</h2>
      <p>Here is your summary for the day:</p>
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 10px 0; border-bottom: 1px solid #f9f9f9;"><strong>Total Orders:</strong> ${totalOrders}</li>
        <li style="padding: 10px 0; border-bottom: 1px solid #f9f9f9;"><strong>Completed Orders:</strong> ${completedOrders}</li>
        <li style="padding: 10px 0; border-bottom: 1px solid #f9f9f9;"><strong>Total Earnings:</strong> ₹${totalEarnings.toFixed(2)}</li>
      </ul>
      <p style="color: #888; font-size: 12px; margin-top: 20px;">Insight Engine - Restaurant OS</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `Daily Report: ${hotelName} - ${date}`, html });
};

const sendAnalyticsReport = async (emails, reportData) => {
    const { title, period, stats, hotelName } = reportData;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; border-radius: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
            <p style="color: #64748b; font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 0 0 10px 0;">${hotelName || 'Establishment'}</p>
            <h2 style="color: #1a1a1a; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">${title}</h2>
            <p style="color: #6366f1; font-weight: bold; margin-top: 5px;">Period: ${period}</p>
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 15px; padding: 25px; margin-bottom: 30px;">
            <div style="display: grid; gap: 20px;">
                ${stats.map(stat => `
                    <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 15px;">
                        <p style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0; font-weight: 800;">${stat.label}</p>
                        <p style="font-size: 20px; color: #1e293b; font-weight: 800; margin: 0;">${stat.value}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="text-align: center; border-radius: 15px; background: linear-gradient(to right, #6366f1, #a855f7); padding: 10px;">
            <p style="color: #ffffff; margin: 0; font-weight: bold; font-size: 14px;">Insight Engine - Restaurant OS</p>
        </div>
      </div>
    `;
    
    // Join emails if array
    const to = Array.isArray(emails) ? emails.join(', ') : emails;
    return sendEmail({ to, subject: `${title}: ${hotelName} - ${period}`, html });
};

const sendCustomerSpendingReport = async (email, reportData) => {
  const { customerName, totalSpent, totalOrders, dailyDishStats, currencySymbol = '₹' } = reportData;
  
  const dailyBreakdownHtml = Object.entries(dailyDishStats).map(([date, dishes]) => `
    <div style="margin-bottom: 20px; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f7fafc; padding: 10px 15px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #2d3748;">
        ${date}
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #ffffff; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">
            <th style="padding: 10px 15px;">Dish</th>
            <th style="padding: 10px 15px; text-align: center;">Qty</th>
            <th style="padding: 10px 15px; text-align: right;">Spent</th>
          </tr>
        </thead>
        <tbody>
          ${dishes.map(dish => `
            <tr style="border-top: 1px solid #edf2f7;">
              <td style="padding: 10px 15px; color: #4a5568;">${dish.name}</td>
              <td style="padding: 10px 15px; text-align: center; color: #4a5568;">${dish.quantity}</td>
              <td style="padding: 10px 15px; text-align: right; color: #4a5568;">${currencySymbol}${dish.spent.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; color: #2d3748; line-height: 1.6;">
      <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Spending Report</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">For ${customerName}</p>
      </div>
      
      <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background-color: white;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; text-align: center;">
          <div style="flex: 1; padding: 15px; background-color: #f0f4ff; border-radius: 10px; margin-right: 10px;">
            <p style="font-size: 12px; color: #6366f1; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">Total Spent</p>
            <p style="font-size: 20px; font-weight: 800; color: #1a202c; margin: 0;">${currencySymbol}${totalSpent.toFixed(2)}</p>
          </div>
          <div style="flex: 1; padding: 15px; background-color: #f0f4ff; border-radius: 10px;">
            <p style="font-size: 12px; color: #6366f1; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">Total Orders</p>
            <p style="font-size: 20px; font-weight: 800; color: #1a202c; margin: 0;">${totalOrders}</p>
          </div>
        </div>

        <h3 style="color: #1a202c; margin-bottom: 20px; font-size: 18px; border-left: 4px solid #6366f1; padding-left: 10px;">Daily Breakdown by Dish</h3>
        ${dailyBreakdownHtml}
        
        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #a0aec0; font-size: 12px;">This report was generated automatically by Restaurant OS.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject: `Personal Spending Report - ${customerName}`, html });
};

const sendOrderReceipt = async (email, orderData) => {
  const { orderNumber, hotelName, items, totalAmount, discountAmount, finalAmount, date, currencySymbol = '₹' } = orderData;
  
  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 0; color: #4a5568;">
        <p style="margin: 0; font-weight: bold;">${item.name}</p>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #718096;">Qty: ${item.quantity} x ${currencySymbol}${item.price.toFixed(2)}</p>
      </td>
      <td style="padding: 12px 0; text-align: right; color: #2d3748; font-weight: bold;">
        ${currencySymbol}${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: auto; color: #2d3748; background-color: #f8fafc; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 20px; padding: 40px; shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 10px 20px; background-color: #f1f5f9; border-radius: 12px; margin-bottom: 15px;">
            <p style="margin: 0; font-size: 12px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">${hotelName}</p>
          </div>
          <h2 style="margin: 0; font-size: 24px; font-weight: 900; color: #1e293b;">Digital Receipt</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Order #${orderNumber} • ${date}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          ${itemsHtml}
        </table>

        <div style="border-top: 2px dashed #e2e8f0; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #64748b; font-size: 14px;">Subtotal</span>
            <span style="color: #1e293b; font-weight: bold;">${currencySymbol}${totalAmount.toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #ef4444;">
              <span style="font-size: 14px;">Discount</span>
              <span style="font-weight: bold;">-${currencySymbol}${discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 12px;">
            <span style="color: #1e293b; font-weight: 800; font-size: 18px;">Total</span>
            <span style="color: #6366f1; font-weight: 900; font-size: 22px;">${currencySymbol}${finalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">Thank you for dining with us!</p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">RestoSync • Smart Dining Ecosystem</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject: `Your Receipt from ${hotelName} - #${orderNumber}`, html });
};

module.exports = {
  sendEmail,
  sendOTP,
  sendDailyAnalytics,
  sendAnalyticsReport,
  sendCustomerSpendingReport,
  sendOrderReceipt
};

const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

// Email transporter
let mailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Create notification
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Send email notification
const sendEmailNotification = async (to, subject, html) => {
  if (!mailTransporter) {
    console.log('Email not configured. Notification:', subject);
    return false;
  }

  try {
    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send SMS notification
const sendSMSNotification = async (to, message) => {
  if (!twilioClient || !process.env.TWILIO_FROM) {
    console.log('SMS not configured. Notification:', message);
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to
    });
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

// Notify order status change
const notifyOrderStatusChange = async (order, customer, hotel) => {
  const statusMessages = {
    pending: 'Your order has been received and is being processed.',
    preparing: 'Your order is being prepared.',
    ready: 'Your order is ready for pickup/delivery.',
    completed: 'Your order has been completed. Thank you!',
    cancelled: 'Your order has been cancelled.'
  };

  const message = statusMessages[order.status] || 'Your order status has been updated.';
  
  // Create in-app notification
  await createNotification({
    hotelId: hotel._id,
    userId: customer._id,
    userType: 'customer',
    type: 'order',
    title: `Order ${order.orderNumber} - ${order.status}`,
    message: message,
    data: { orderId: order._id, orderNumber: order.orderNumber }
  });

  // Send email if customer has email
  if (customer.email) {
    await sendEmailNotification(
      customer.email,
      `Order ${order.orderNumber} Status Update`,
      `<h2>Order Status Update</h2><p>${message}</p><p>Order Number: ${order.orderNumber}</p>`
    );
  }

  // Send SMS if customer has phone
  if (customer.phone) {
    await sendSMSNotification(
      customer.phone,
      `Order ${order.orderNumber}: ${message}`
    );
  }
};

module.exports = {
  createNotification,
  sendEmailNotification,
  sendSMSNotification,
  notifyOrderStatusChange
};


const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate order receipt
const generateOrderReceipt = async (order, hotel, customer) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `receipt-${order.orderNumber}-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../uploads/receipts', filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(hotel.name, { align: 'center' });
    if (hotel.address) {
      doc.fontSize(12).text(hotel.address, { align: 'center' });
    }
    doc.moveDown();

    // Order details
    doc.fontSize(16).text('Order Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Order Number: ${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.orderDate).toLocaleString()}`);
    doc.text(`Customer: ${customer.name}`);
    doc.text(`Table: ${order.tableId?.tableNumber || 'N/A'}`);
    doc.text(`Status: ${order.status.toUpperCase()}`);
    doc.moveDown();

    // Items
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    
    let yPos = doc.y;
    order.items.forEach((item, index) => {
      doc.text(`${item.quantity}x ${item.name}`, { continued: false });
      doc.text(formatCurrency(item.price * item.quantity), { align: 'right' });
      if (item.specialInstructions) {
        doc.fontSize(8).text(`  Note: ${item.specialInstructions}`, { indent: 20 });
        doc.fontSize(10);
      }
      doc.moveDown(0.3);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Totals
    doc.fontSize(10);
    doc.text('Subtotal:', { continued: true, align: 'right' });
    doc.text(formatCurrency(order.totalAmount), { align: 'right' });
    
    if (order.discountAmount > 0) {
      doc.text('Discount:', { continued: true, align: 'right' });
      doc.text(`-${formatCurrency(order.discountAmount)}`, { align: 'right' });
    }
    
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', { continued: true, align: 'right' });
    doc.text(formatCurrency(order.finalAmount || order.totalAmount), { align: 'right' });
    
    if (order.paymentStatus === 'paid') {
      doc.moveDown();
      doc.fontSize(10).font('Helvetica');
      doc.text('Payment Status: PAID', { align: 'center' });
    }

    doc.moveDown(2);
    doc.fontSize(8).text('Thank you for your order!', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

// Generate kitchen ticket
const generateKitchenTicket = async (order, hotel) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: [216, 279] }); // Small format
    const filename = `kitchen-${order.orderNumber}-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../uploads/kitchen', filename);

    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.fontSize(16).font('Helvetica-Bold').text(`ORDER #${order.orderNumber}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Table: ${order.tableId?.tableNumber || 'N/A'}`);
    doc.text(`Time: ${new Date(order.orderDate).toLocaleTimeString()}`);
    doc.moveDown();

    order.items.forEach(item => {
      doc.fontSize(12).font('Helvetica-Bold').text(`${item.quantity}x ${item.name}`);
      if (item.specialInstructions) {
        doc.fontSize(10).font('Helvetica-Oblique').text(`  → ${item.specialInstructions}`, { indent: 20 });
      }
      doc.moveDown(0.5);
    });

    if (order.specialInstructions) {
      doc.moveDown();
      doc.fontSize(10).font('Helvetica-Bold').text('Special Instructions:');
      doc.fontSize(10).font('Helvetica').text(order.specialInstructions);
    }

    doc.end();

    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

module.exports = {
  generateOrderReceipt,
  generateKitchenTicket
};









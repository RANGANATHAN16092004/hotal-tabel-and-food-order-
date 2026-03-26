const PDFDocument = require('pdfkit');
const { formatCurrency } = require('./format'); // I'll check if this exists or create it

const generateReceipt = (order, hotel) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A5' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // Add Logo if exists (placeholder for now as it needs a local path or buffer)
        // doc.image('path/to/logo.png', 50, 45, { width: 50 })

        // Hotel Info
        doc.fillColor('#1e293b')
            .fontSize(20)
            .font('Helvetica-Bold')
            .text(hotel.name, { align: 'right' })
            .fontSize(10)
            .font('Helvetica')
            .text(hotel.address || '', { align: 'right' })
            .text(hotel.phone || '', { align: 'right' })
            .moveDown();

        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#e2e8f0');
        doc.moveDown();

        // Order Info
        doc.fontSize(12).font('Helvetica-Bold').text('INVOICE', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
            .text(`Order ID: #${order.orderNumber}`)
            .text(`Date: ${new Date(order.orderDate).toLocaleString()}`)
            .text(`Table: ${order.tableId?.tableNumber || 'N/A'}`)
            .moveDown();

        // Table Header
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 200, tableTop, { width: 30, align: 'right' });
        doc.text('Price', 250, tableTop, { width: 60, align: 'right' });
        doc.text('Total', 320, tableTop, { width: 60, align: 'right' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#f1f5f9');

        // Items
        doc.font('Helvetica');
        let currentY = doc.y + 10;
        order.items.forEach(item => {
            doc.text(item.name, 50, currentY, { width: 140 });
            doc.text(item.quantity.toString(), 200, currentY, { width: 30, align: 'right' });
            doc.text(item.price.toFixed(2), 250, currentY, { width: 60, align: 'right' });
            doc.text((item.price * item.quantity).toFixed(2), 320, currentY, { width: 60, align: 'right' });
            currentY += 20;
        });

        doc.moveDown();
        doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke('#e2e8f0');
        currentY += 15;

        // Totals
        doc.font('Helvetica-Bold');
        doc.text('Subtotal:', 200, currentY, { width: 110, align: 'right' });
        doc.text(order.totalAmount.toFixed(2), 320, currentY, { width: 60, align: 'right' });

        currentY += 15;
        if (order.discountAmount > 0) {
            doc.text('Discount:', 200, currentY, { width: 110, align: 'right' });
            doc.text(`-${order.discountAmount.toFixed(2)}`, 320, currentY, { width: 60, align: 'right' });
            currentY += 15;
        }

        doc.fontSize(14).fillColor('#4f46e5');
        doc.text('Grand Total:', 200, currentY, { width: 110, align: 'right' });
        doc.text(`INR ${order.finalAmount.toFixed(2)}`, 320, currentY, { width: 60, align: 'right' });

        // Footer
        doc.fontSize(8).fillColor('#94a3b8')
            .text('Thank you for dining with us!', 50, doc.page.height - 70, { align: 'center' })
            .text(`Powered by Culinary Pulse Pro`, { align: 'center' });

        doc.end();
    });
};

module.exports = { generateReceipt };

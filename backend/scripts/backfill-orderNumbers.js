/*
Backfill missing orderNumber on historical orders.
Usage: NODE_ENV=production node scripts/backfill-orderNumbers.js
Make sure MONGODB_URI is defined in env or in backend/.env
*/

const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../models/Order');
const Counter = require('../models/Counter');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in environment');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const query = { $or: [{ orderNumber: { $exists: false } }, { orderNumber: null }, { orderNumber: '' }] };
  const count = await Order.countDocuments(query);
  console.log(`Found ${count} orders missing orderNumber`);

  if (count === 0) {
    console.log('Nothing to do');
    process.exit(0);
  }

  const cursor = Order.find(query).sort({ createdAt: 1 }).cursor();
  let applied = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      const counter = await Counter.findOneAndUpdate({ name: 'orderNumber' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
      const newOrderNumber = `ORD${String(counter.seq).padStart(8, '0')}`;
      doc.orderNumber = newOrderNumber;
      await doc.save();
      console.log(`Set ${doc._id} -> ${newOrderNumber}`);
      applied += 1;
    } catch (err) {
      console.error('Failed to set orderNumber for', doc._id, err);
    }
  }

  console.log(`Backfilled ${applied} orders`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
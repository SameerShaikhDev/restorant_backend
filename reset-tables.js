const mongoose = require('mongoose');
require('dotenv').config();

async function releaseAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Reset all tables
    const result = await mongoose.connection.db.collection('tables')
      .updateMany(
        {}, 
        { 
          $set: { 
            status: 'available', 
            reservedUntil: null, 
            reservedFor: '' 
          } 
        }
      );
    
    console.log(`✅ Released ${result.modifiedCount} tables`);
    
    // Show updated status
    const tables = await mongoose.connection.db.collection('tables')
      .find({}, { tableNumber: 1, status: 1 })
      .toArray();
    
    console.log('\n📋 Updated table status:');
    tables.forEach(t => {
      console.log(`  ${t.tableNumber}: ${t.status}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ All tables are now available!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

releaseAll();
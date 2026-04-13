import { getDb } from "./db";
import { sql } from "drizzle-orm";

async function fixDbEnum() {
  console.log("Starting DB Enum fix...");
  const db = await getDb();
  
  if (!db) {
    console.error("Could not connect to database. Make sure DATABASE_URL is set.");
    process.exit(1);
  }

  try {
    console.log("Updating 'orders' table status enum...");
    // Direct SQL to alter the enum column in MySQL
    await db.execute(sql`
      ALTER TABLE \`orders\` 
      MODIFY COLUMN \`status\` ENUM(
        'pending', 
        'assigned', 
        'accepted', 
        'picked_up', 
        'in_transit', 
        'arrived', 
        'delivered', 
        'cancelled'
      ) DEFAULT 'pending' NOT NULL
    `);
    console.log("Successfully updated 'orders' table.");

    console.log("Updating 'notifications' table type enum...");
    // Also update notifications type if needed to support new order states
    await db.execute(sql`
      ALTER TABLE \`notifications\` 
      MODIFY COLUMN \`type\` ENUM(
        'order_assigned',
        'order_accepted',
        'order_picked_up',
        'order_in_transit',
        'order_arrived',
        'order_delivered',
        'order_cancelled',
        'new_order_available',
        'system'
      ) DEFAULT 'system' NOT NULL
    `);
    console.log("Successfully updated 'notifications' table.");

    console.log("All fixes applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error applying fixes:", error);
    process.exit(1);
  }
}

fixDbEnum();

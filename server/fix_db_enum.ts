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
    try {
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
      console.log("Successfully updated 'orders' table status enum.");
    } catch (e: any) {
      console.warn("Could not update orders status enum:", e.message);
    }

    console.log("Updating 'notifications' table type enum...");
    try {
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
    } catch (e: any) {
      console.warn("Could not update notifications type enum:", e.message);
    }

    console.log("Checking for 'avatarUrl' column in 'users' table...");
    try {
      await db.execute(sql`
        ALTER TABLE \`users\` 
        ADD COLUMN IF NOT EXISTS \`avatarUrl\` LONGTEXT
      `);
      console.log("Successfully added 'avatarUrl' column to 'users' table.");
    } catch (e: any) {
      if (e.message.includes("Duplicate column name")) {
        console.log("'avatarUrl' column already exists.");
      } else {
        console.warn("Could not add 'avatarUrl' column:", e.message);
      }
    }

    console.log("Ensuring 'offers' table matches schema...");
    try {
      // Create table if it doesn't exist with correct schema
      // Using DATETIME for compatibility and ensuring defaults for all timestamps
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`offers\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`description\` text,
          \`imageUrl\` LONGTEXT NOT NULL,
          \`link\` varchar(500),
          \`isActive\` tinyint(1) DEFAULT '1' NOT NULL,
          \`expiresAt\` DATETIME NOT NULL,
          \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
      
      // If table exists, ensure columns match schema and have defaults
      try {
        await db.execute(sql`ALTER TABLE \`offers\` MODIFY COLUMN \`imageUrl\` LONGTEXT NOT NULL`);
        await db.execute(sql`ALTER TABLE \`offers\` MODIFY COLUMN \`expiresAt\` DATETIME NOT NULL`);
        await db.execute(sql`ALTER TABLE \`offers\` MODIFY COLUMN \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL`);
        await db.execute(sql`ALTER TABLE \`offers\` MODIFY COLUMN \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL`);
        console.log("Successfully synchronized 'offers' table with schema.");
      } catch (modifyError: any) {
        console.warn("Could not modify some columns in 'offers':", modifyError.message);
      }
    } catch (e: any) {
      console.error("Failed to ensure 'offers' table schema:", e.message);
    }

    console.log("All fixes applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error applying fixes:", error);
    process.exit(1);
  }
}

fixDbEnum();

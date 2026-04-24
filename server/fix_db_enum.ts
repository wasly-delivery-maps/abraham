import { getDb } from "./db";
import { sql } from "drizzle-orm";

export async function runFixes() {
  console.log("Starting DB Schema synchronization...");
  const db = await getDb();
  
  if (!db) {
    console.error("Could not connect to database. Make sure DATABASE_URL is set.");
    return;
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

    console.log("Checking for 'avatarUrl' column in 'users' table...");
    try {
      await db.execute(sql`
        ALTER TABLE \`users\` 
        ADD COLUMN IF NOT EXISTS \`avatarUrl\` TEXT
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
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`offers\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`description\` text,
          \`imageUrl\` LONGTEXT NOT NULL,
          \`link\` varchar(500),
          \`isActive\` tinyint(1) DEFAULT '1' NOT NULL,
          \`expiresAt\` datetime NOT NULL,
          \`createdAt\` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
          \`updatedAt\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e: any) {
      console.error("Failed to ensure 'offers' table schema:", e.message);
    }

    console.log("Ensuring 'coupons' and 'user_coupons' tables exist...");
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`coupons\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`code\` varchar(50) NOT NULL,
          \`discountType\` enum('percentage','fixed') NOT NULL,
          \`discountValue\` decimal(10,2) NOT NULL,
          \`maxDiscount\` decimal(10,2) DEFAULT NULL,
          \`minOrderValue\` decimal(10,2) DEFAULT '0.00',
          \`expiresAt\` timestamp NULL DEFAULT NULL,
          \`usageLimit\` int DEFAULT NULL,
          \`usedCount\` int NOT NULL DEFAULT '0',
          \`isActive\` tinyint(1) NOT NULL DEFAULT '1',
          \`isFirstOrderOnly\` tinyint(1) NOT NULL DEFAULT '0',
          \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`code_unique\` (\`code\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`user_coupons\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`userId\` int NOT NULL,
          \`couponId\` int NOT NULL,
          \`orderId\` int DEFAULT NULL,
          \`usedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

	      try {
	        const existingCoupons50 = await db.execute(sql`SELECT id FROM \`coupons\` WHERE \`code\` = 'WASLY50'`);
	        if (!existingCoupons50 || (existingCoupons50 as any)[0].length === 0) {
	          await db.execute(sql`
	            INSERT INTO \`coupons\` (code, discountType, discountValue, maxDiscount, minOrderValue, isFirstOrderOnly)
	            VALUES ('WASLY50', 'percentage', 50.00, 50.00, 0.00, 1)
	          `);
	          console.log("Created default coupon 'WASLY50'");
	        }

	        const existingCoupons20 = await db.execute(sql`SELECT id FROM \`coupons\` WHERE \`code\` = 'WASLY20'`);
	        if (!existingCoupons20 || (existingCoupons20 as any)[0].length === 0) {
	          await db.execute(sql`
	            INSERT INTO \`coupons\` (code, discountType, discountValue, maxDiscount, minOrderValue, isFirstOrderOnly)
	            VALUES ('WASLY20', 'percentage', 20.00, 30.00, 0.00, 0)
	          `);
	          console.log("Created default coupon 'WASLY20'");
	        }
	      } catch (couponError: any) {
	        console.warn("Could not check/create default coupon:", couponError.message);
	      }
      
      console.log("Successfully ensured coupon tables exist.");
    } catch (couponTableError: any) {
      console.error("Failed to ensure coupon tables:", couponTableError.message);
    }

    console.log("All schema fixes applied successfully!");
  } catch (error) {
    console.error("Error applying schema fixes:", error);
  }
}

// Keep the auto-run for manual execution
if (require.main === module) {
  runFixes().then(() => process.exit(0)).catch(() => process.exit(1));
}

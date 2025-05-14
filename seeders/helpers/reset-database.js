'use strict';

const sequelize = require('../../models');

async function resetDatabase(queryInterface) {
    try {
        // Disable foreign key checks
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Get all table names
        const [tables] = await queryInterface.sequelize.query(
            "SELECT TABLE_NAME as name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
        );

        // Truncate all tables
        for (const table of tables) {
            await queryInterface.sequelize.query(`TRUNCATE TABLE ${table.name}`);
            console.log(`✓ Cleared table: ${table.name}`);
        }

        // Re-enable foreign key checks
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('🗑️  Database cleared successfully');
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        throw error;
    }
}

// Execute the function when file is run directly
async function main() {
    try {
        console.log('🗑️  Starting database reset...');
        await resetDatabase(sequelize.getQueryInterface());
    } catch (error) {
        console.error('❌ Failed to reset database:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

// Check if this file is being run directly
if (require.main === module) {
    main();
}

module.exports = { resetDatabase }; 
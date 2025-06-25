#!/usr/bin/env node

const { createDashboard, login } = require('./zabbixApiClient');

async function testCorrectedDashboard() {
    try {
        console.log(' Logging in...');
        await login();
        console.log(' Successfully logged in');
        
        // Test minimal dashboard following EXACT documentation format
        console.log('\n Testing corrected dashboard format...');
        const minimalData = {
            name: 'TEST - Error 32062 Fix',
            display_period: 30,
            auto_start: 1,
            pages: [  //  REQUIRED parameter from documentation
                {
                    widgets: [
                        {
                            type: 'clock',
                            x: 0,
                            y: 0,
                            width: 12,
                            height: 4,
                            view_mode: 0,
                            fields: []
                        }
                    ]
                }
            ]
        };
        
        console.log('Data structure:', JSON.stringify(minimalData, null, 2));
        
        const result = await createDashboard(minimalData);
        console.log(' SUCCESS! Dashboard created with ID:', result.dashboardids[0]);
        console.log(' Error 32062 FIXED!');
        
    } catch (error) {
        console.error(' Error:', error.message);
        
        // Analyze error 32062
        if (error.message.includes('32062') || error.message.includes('Invalid params')) {
            console.log('\n Error 32062 Analysis:');
            console.log('- Error 32062 = "Invalid params"');
            console.log('- Check: pages parameter is required');
            console.log('- Check: widget field types (0=int, 1=string, 2=hostgroup)');
            console.log('- Check: authentication token validity');
            console.log('- Check: widget positioning and sizing');
        }
        
        throw error;
    }
}

testCorrectedDashboard();

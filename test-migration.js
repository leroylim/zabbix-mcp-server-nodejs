console.log("🔍 Testing Enhanced API Migration...");

try {
    const api = require("./src/api");
    console.log("✅ API imported successfully");
    console.log("📊 Total functions:", Object.keys(api).length);
    
    console.log("\n🚀 Testing Enhanced Functions:");
    
    // Test enhanced host functions
    const enhancedHostFunctions = [
        "getHostsByName", 
        "getHostsByGroups", 
        "enableHosts", 
        "disableHosts"
    ];
    
    enhancedHostFunctions.forEach(fn => {
        console.log(`  ${fn}:`, typeof api[fn] === 'function' ? '✅ Available' : '❌ Missing');
    });
    
    // Test enhanced maintenance functions
    const enhancedMaintenanceFunctions = [
        "getActiveMaintenanceWindows",
        "getMaintenanceWindowsByName", 
        "getUpcomingMaintenanceWindows",
        "getMaintenanceStatistics"
    ];
    
    enhancedMaintenanceFunctions.forEach(fn => {
        console.log(`  ${fn}:`, typeof api[fn] === 'function' ? '✅ Available' : '❌ Missing');
    });
    
    // Test other enhanced functions
    const otherEnhancedFunctions = [
        "getItemsByHost",
        "getProblemsByHost", 
        "getUsersByRole",
        "getTemplatesByName",
        "getNetworkMaps"
    ];
    
    otherEnhancedFunctions.forEach(fn => {
        console.log(`  ${fn}:`, typeof api[fn] === 'function' ? '✅ Available' : '❌ Missing');
    });
    
    // Count enhancement
    const allFunctions = Object.keys(api);
    const enhancedCount = [...enhancedHostFunctions, ...enhancedMaintenanceFunctions, ...otherEnhancedFunctions]
        .filter(fn => typeof api[fn] === 'function').length;
    const totalEnhanced = enhancedHostFunctions.length + enhancedMaintenanceFunctions.length + otherEnhancedFunctions.length;
    
    console.log(`\n📈 Enhancement Status: ${enhancedCount}/${totalEnhanced} enhanced functions available`);
    console.log(`🎯 Migration Success Rate: ${Math.round((enhancedCount/totalEnhanced)*100)}%`);
    
    if (enhancedCount === totalEnhanced) {
        console.log("\n🎉 MIGRATION TEST PASSED! All enhanced functions are available.");
    } else {
        console.log(`\n⚠️  MIGRATION TEST PARTIAL: ${totalEnhanced - enhancedCount} functions missing.`);
    }
    
} catch (error) {
    console.error("❌ Migration test failed:", error.message);
} 
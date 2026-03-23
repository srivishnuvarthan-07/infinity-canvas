/**
 * Rate Limiter for Free AI Usage
 * Logic:
 * - If user has any API key saved -> skip rate limiting (unlimited: true)
 * - If on free tier -> 10 requests per day limit
 */
async function checkAndIncrementUsage(user) {
    // 1. Check if user has any custom API keys saved
    const hasAnyKey = Object.values(user.aiConfig.keys).some(key => key !== null && key !== '');
    
    if (hasAnyKey) {
        return { allowed: true, unlimited: true };
    }

    // 2. Free Tier Logic
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check if we need to reset the count for a new day
    if (user.aiConfig.freeUsage.resetDate !== today) {
        user.aiConfig.freeUsage.count = 0;
        user.aiConfig.freeUsage.resetDate = today;
    }

    // Check if limit reached
    if (user.aiConfig.freeUsage.count >= 10) {
        return {
            allowed: false,
            remaining: 0,
            resetDate: today,
            message: "Daily limit reached. Add your own API key for unlimited access."
        };
    }

    // Increment usage
    user.aiConfig.freeUsage.count += 1;
    
    // Note: The caller is responsible for saving the user document to avoid redundant saves
    // Or we can save here for safety if we prefer. Given the requirement "Save to MongoDB", let's save.
    await user.save();

    return {
        allowed: true,
        remaining: 10 - user.aiConfig.freeUsage.count,
        unlimited: false
    };
}

module.exports = {
    checkAndIncrementUsage
};

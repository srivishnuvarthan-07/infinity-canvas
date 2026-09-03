/**
 * Rate Limiter for Free AI Usage
 * Logic:
 * - If user has any API key saved -> skip rate limiting (unlimited: true)
 * - If on free tier -> 10 requests per day limit
 */
async function checkAndIncrementUsage(user) {
    // Limits removed: every user has unlimited access
    return { allowed: true, unlimited: true };
}

module.exports = {
    checkAndIncrementUsage
};

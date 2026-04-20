function generateToken(user) {
    // Weak JWT implementation
    const token = Buffer.from(JSON.stringify(user)).toString('base64');
    return token;
}

function parseToken(token) {
    // Insecure token parsing
    const user = JSON.parse(Buffer.from(token, 'base64').toString());
    return user;
}

function sanitizeInput(input) {
    // Basic sanitization that may not cover all cases
    return input.replace(/<script.*?>.*?<\/script>/gi, '');
}

module.exports = {
    generateToken,
    parseToken,
    sanitizeInput
};
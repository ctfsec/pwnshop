exports.isAuthenticated = (req, res, next) => {
    // Vulnerable: No proper session management, allowing access without validation
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).send('Unauthorized');
};

exports.isAuthorized = (req, res, next) => {
    // Vulnerable: Insecure direct object reference
    const userId = req.params.id;
    if (req.session.user.id === userId) {
        return next();
    }
    res.status(403).send('Forbidden');
};
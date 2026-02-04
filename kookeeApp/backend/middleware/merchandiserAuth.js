const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || "kookee-secret-key-change-in-prod";

/**
 * Merchandiser Authentication Middleware
 * 
 * Validates JWT token and ensures user has merchandiser role
 */
function merchandiserAuth(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "No token provided" });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, SECRET_KEY);

        // Check if user has merchandiser or admin role
        if (decoded.role !== 'merchandiser' && decoded.role !== 'MERCHANDISER' && decoded.role !== 'admin' && decoded.role !== 'ADMIN') {
            return res.status(403).json({ error: "Access denied - Merchandiser or Admin role required" });
        }

        // Attach user info to request
        req.user = decoded;

        // Log request for audit trail
        // console.log(`[MERCHANDISER AUTH] ${decoded.username || decoded.id} accessing ${req.method} ${req.originalUrl}`);

        next();
    } catch (error) {
        // console.error('[MERCHANDISER AUTH ERROR]', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired" });
        }

        if (error.name === 'JsonWebTokenError') {
            console.warn('[AUTH WARNING] Invalid token received:', error.message);
            return res.status(401).json({ error: "Invalid token" });
        }

        return res.status(500).json({ error: "Authentication error" });
    }
}

module.exports = merchandiserAuth;

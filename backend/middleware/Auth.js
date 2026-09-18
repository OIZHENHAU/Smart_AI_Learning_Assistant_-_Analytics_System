import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findAcountById(decoded.id);

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found',
                    statusCode: 401
                });
            }

            next();

        } catch (error) {
            console.error('Authentication middleware error: ', error);

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token has expired!',
                    statusCode: 401
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Not authoerised, token failed.',
                statusCode: 401
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token exist in the system.',
            statusCode: 401
        });
    }
}

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: "You do not have the permission to access this resource.",
            statusCode: 403
        });
    }
    next();
};

export default protect;
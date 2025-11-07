import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token from request headers
 * Expects: Authorization: Bearer <token>
 * Attaches decoded user data to req.user
 */
export const verifyJWT = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer '

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.error('JWT verification error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Error handling middleware
 * Should be last middleware registered
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    error: isDevelopment ? err.message : 'Internal server error'
  };

  // Set status code
  const status = err.status || err.statusCode || 500;
  
  res.status(status).json(response);
};

/**
 * 404 Not Found handler
 * Should be second to last middleware
 */
export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
};

/**
 * Middleware to parse JSON and handle errors
 */
export const jsonParser = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
};

export default {
  verifyJWT,
  errorHandler,
  notFound,
  jsonParser
};

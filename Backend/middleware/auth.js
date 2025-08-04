// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No authorization header or invalid format');
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  console.log('Verifying token:', token.substring(0, 10) + '...'); // Log partial token for security
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      return res.status(401).json({ message: 'Token verification failed' });
    }
    req.user = decoded;
    req.user.role = decoded.roles ? decoded.roles[0] : null;  // Set a singular 'role' for easier access
    console.log('Decoded token:', { uid: decoded.uid, roles: decoded.roles, role: req.user.role }); // Log non-sensitive parts
    next();
  });
};
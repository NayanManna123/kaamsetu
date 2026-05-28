/**
 * Role Guard Middleware Factory
 * Restricts route access based on user roles
 * 
 * Usage: roleGuard('company', 'admin') — allows only company and admin roles
 */
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

export default roleGuard;

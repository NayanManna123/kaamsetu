/**
 * Utility helpers for the KaamSetu backend
 */

/**
 * Calculate distance between two [lng, lat] coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calcDistance = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Build pagination parameters from query string
 */
export const paginate = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build a filter query object from request query parameters
 */
export const buildFilterQuery = (query, allowedFields) => {
  const filter = {};
  for (const field of allowedFields) {
    if (query[field]) {
      filter[field] = query[field];
    }
  }
  return filter;
};

/**
 * Format a response with pagination metadata
 */
export const paginatedResponse = (data, total, page, limit) => {
  return {
    success: true,
    count: data.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data,
  };
};

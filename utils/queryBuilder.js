function buildQuery(req) {
  const { sort, page = 1, limit = 10, ...filters } = req.query;

  const query = {
    isDeleted: false,
    ...filters
  };

  const options = {
    skip: (parseInt(page) - 1) * parseInt(limit),
    limit: parseInt(limit),
    sort: sort ? sort.split(',').reduce((acc, key) => {
      acc[key.replace('-', '')] = key.startsWith('-') ? -1 : 1;
      return acc;
    }, {}) : { createdAt: -1 }
  };

  return { query, options };
}

module.exports = buildQuery;

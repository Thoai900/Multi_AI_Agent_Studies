function errorHandler(err, _req, res, _next) {
  console.error(`[error] ${err.message}`);

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;

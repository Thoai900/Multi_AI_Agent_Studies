const isProd = process.env.NODE_ENV === "production";

function errorHandler(err, req, res, _next) {
  const status  = err.status || err.statusCode || 500;
  const message = isProd && status === 500 ? "Internal server error" : err.message;

  // Only log 5xx — 4xx are expected client errors
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.path} →`, err.message);
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;

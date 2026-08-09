export function healthCheck(req, res) {
  res.json({
    status: 'ok',
    message: 'SIAP API is running',
    timestamp: new Date().toISOString(),
  });
}
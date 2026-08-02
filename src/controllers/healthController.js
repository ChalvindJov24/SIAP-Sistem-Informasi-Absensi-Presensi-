export const healthCheck = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SIAP API is running',
    timestamp: new Date().toISOString(),
  });
};
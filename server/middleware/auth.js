const jwt = require('jsonwebtoken')

module.exports = function auth(req, res, next) {
  const token = req.cookies[process.env.JWT_COOKIE_NAME || 'token']
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.id, email: payload.email }
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}
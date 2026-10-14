const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { config } = require('./config');

async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function verifyPassword(hash, password) {
  try {
    if (!hash) return false;
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

function uuid() {
  return crypto.randomUUID();
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, uuid };
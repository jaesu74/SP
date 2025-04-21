const express = require('express');
const admin = require('../lib/firebase-admin');

const router = express.Router();

router.post('/login', async (req, res) => {
  const idToken = req.body.token;
  if (!idToken) {
    return res.status(400).json({ error: '토큰이 제공되지 않았습니다.' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return res.json({ success: true, uid: decodedToken.uid });
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
});

module.exports = router; 
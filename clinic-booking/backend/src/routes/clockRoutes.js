const express = require('express');
const { setClock, getClock, resetClock, getOutbox } = require('../controllers/clockController');

const router = express.Router();

router.post('/clock', setClock);
router.get('/clock', getClock);
router.post('/clock/reset', resetClock);
router.get('/outbox', getOutbox);

module.exports = router;


import { Router } from 'express';
import {
  runJazzcashIpn,
  runCheckPaymentStatus,
  runInitiateMwalletCnic,
} from '../lib/jazzcashLogic.js';

const router = Router();

/**
 * IPN (Instant Payment Notification)
 * JazzCash POSTs here when payment status changes.
 */
router.post('/jazzcash-ipn', async (req, res) => {
  const out = await runJazzcashIpn(req.body || {});
  if (out.json) return res.status(out.statusCode).json(out.json);
  return res.status(out.statusCode).send(out.text ?? '');
});

/**
 * Status Inquiry - Check transaction status with JazzCash
 */
router.post('/check-payment-status', async (req, res) => {
  const out = await runCheckPaymentStatus(req.body || {});
  return res.status(out.statusCode).json(out.json);
});

/**
 * MWALLET REST API v2.0 (with CNIC) - initiate payment
 */
router.post('/initiate-mwallet-cnic', async (req, res) => {
  const out = await runInitiateMwalletCnic(req.body || {});
  return res.status(out.statusCode).json(out.json);
});

export default router;

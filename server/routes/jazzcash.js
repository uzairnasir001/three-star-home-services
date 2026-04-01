import { Router } from 'express';
import {
  runJazzcashIpn,
  runCheckPaymentStatus,
  runInitiateMwalletCnic,
  runInitiateJazzcashCard,
  buildJazzcashCardReturnRedirect,
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

/**
 * Card Page Redirection v1.1 (MPAY) — returns action URL + signed form fields
 */
router.post('/initiate-jazzcash-card', async (req, res) => {
  const out = await runInitiateJazzcashCard(req.body || {});
  return res.status(out.statusCode).json(out.json);
});

/**
 * Browser return from JazzCash (POST). Redirects to SPA with pp_* in query + #book.
 */
router.post('/jazzcash-card-return', (req, res) => {
  const location = buildJazzcashCardReturnRedirect(req.body || {});
  return res.redirect(302, location);
});

export default router;

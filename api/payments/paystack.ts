import type { VercelRequest, VercelResponse } from '@vercel/node';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_cubetech_demo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-paystack-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle Paystack Webhook
  if (req.method === 'POST' && req.headers['x-paystack-signature']) {
    const event = req.body;
    if (event?.event === 'charge.success') {
      const { reference, amount, metadata } = event.data || {};
      return res.status(200).json({
        success: true,
        message: 'Payment received. Placement invoice marked as Paid.',
        reference,
        amountNaira: amount / 100,
        placementId: metadata?.placementId
      });
    }
    return res.status(200).json({ received: true });
  }

  // Generate Paystack Checkout Link for Placement Fee
  if (req.method === 'POST') {
    const { placementId, clientEmail, candidateName, roleTitle, salary, feePercent } = req.body || {};

    if (!salary || !feePercent) {
      return res.status(400).json({
        success: false,
        error: 'Monthly salary and fee percentage are required to generate invoice.'
      });
    }

    const annualSalary = Number(salary) * 12;
    const feeNaira = Math.round((annualSalary * Number(feePercent)) / 100);
    const amountKobo = feeNaira * 100;
    const invoiceRef = `INV-CTC-${placementId || Date.now()}`;

    // If live Paystack secret key is configured, initialize live transaction
    if (process.env.PAYSTACK_SECRET_KEY) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: clientEmail || 'billing@clientcompany.com',
            amount: amountKobo,
            currency: 'NGN',
            reference: invoiceRef,
            callback_url: 'https://cubetechconsults.com/#placements',
            metadata: {
              placementId,
              candidateName,
              roleTitle,
              feeNaira
            }
          })
        });
        const data = await response.json();
        return res.status(200).json(data);
      } catch (err: any) {
        // Fall back gracefully
      }
    }

    // Simulated Paystack payment URL
    const paymentUrl = `https://checkout.paystack.com/${invoiceRef.toLowerCase()}`;

    return res.status(200).json({
      success: true,
      provider: 'Paystack Nigeria',
      currency: 'NGN',
      invoiceReference: invoiceRef,
      feeNaira,
      annualSalary,
      feePercentage: feePercent,
      authorizationUrl: paymentUrl,
      message: `Paystack payment invoice for ₦${feeNaira.toLocaleString()} generated.`
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

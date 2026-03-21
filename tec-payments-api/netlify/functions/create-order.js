// netlify/functions/create-order.js
exports.handler = async function(event) {

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const PAYPAL_CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  const PAYPAL_API           = 'https://api-m.paypal.com';

  try {
    const body        = JSON.parse(event.body);
    const amount      = body.amount;
    const description = body.description || 'TEC Web Studio Services';
    const token       = body.token;
    const orderId     = body.orderId;

    // ── Get access token ────────────────────────────────────
    const authRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    const { access_token } = await authRes.json();

    // ── If we have a token + orderId, confirm & capture ─────
    if (orderId && token) {
      console.log('Raw Apple Pay token received:', JSON.stringify(token));

      // PayPal expects this exact structure for the Apple Pay token
      const applePayToken = {
        version:   token.paymentData  ? token.version  : token.version,
        data:      token.paymentData  ? token.paymentData.data      : token.data,
        signature: token.paymentData  ? token.paymentData.signature : token.signature,
        header: {
          ephemeralPublicKey: token.paymentData ? token.paymentData.header.ephemeralPublicKey : token.header.ephemeralPublicKey,
          publicKeyHash:      token.paymentData ? token.paymentData.header.publicKeyHash      : token.header.publicKeyHash,
          transactionId:      token.paymentData ? token.paymentData.header.transactionId      : token.header.transactionId
        }
      };

      console.log('Formatted Apple Pay token:', JSON.stringify(applePayToken));

      // Confirm payment source
      const confirmRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/confirm-payment-source`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${access_token}`,
          'Prefer':        'return=representation'
        },
        body: JSON.stringify({
          payment_source: {
            apple_pay: {
              token: applePayToken
            }
          }
        })
      });
      const confirmed = await confirmRes.json();
      console.log('Confirm response:', JSON.stringify(confirmed));

      if (confirmed.name === 'INVALID_REQUEST' || confirmed.name === 'UNPROCESSABLE_ENTITY') {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, error: 'Confirm failed', details: confirmed })
        };
      }

      // Capture the order
      const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${access_token}`,
          'Prefer':        'return=representation'
        },
        body: '{}'
      });
      const captured = await captureRes.json();
      console.log('Capture response:', JSON.stringify(captured));

      const captureStatus = captured?.purchase_units?.[0]?.payments?.captures?.[0]?.status;
      if (captureStatus === 'COMPLETED') {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true })
        };
      } else {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, details: captured })
        };
      }
    }

    // ── Create order ─────────────────────────────────────────
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'Authorization':     `Bearer ${access_token}`,
        'PayPal-Request-Id': Date.now().toString(),
        'Prefer':            'return=representation'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amount },
          description: description
        }]
      })
    });
    const order = await orderRes.json();
    console.log('Order created:', JSON.stringify(order));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ id: order.id })
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

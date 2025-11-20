# MercadoPago Webhook Configuration Guide

## Overview

This application now implements **secure webhook signature validation** for MercadoPago payment notifications. This prevents unauthorized webhook requests and ensures payment confirmations come from MercadoPago.

## How It Works

When MercadoPago sends a webhook notification, it includes:
- `x-signature` header: Contains timestamp and encrypted signature
- `x-request-id` header: Unique request identifier
- `data.id`: Payment ID in the webhook body

Our service validates these using HMAC-SHA256 encryption with your secret key.

## Configuration Steps

### 1. Get Your Webhook Secret

1. Log in to [MercadoPago Developer Portal](https://www.mercadopago.com/developers/)
2. Go to **Your integrations**
3. Select your application
4. Navigate to the **Webhooks** section
5. Copy the **Secret signature** (it looks like a long random string)

### 2. Configure Environment Variables

Add the webhook secret to your `.env` file:

```bash
# MercadoPago Configuration
MERCAPAGO_ACCESS_TOKEN=your-mercadopago-access-token
MERCAPAGO_WEBHOOK_SECRET=your-webhook-secret-from-step-1
```

### 3. Configure Webhook URL in MercadoPago

Set your webhook URL in the MercadoPago dashboard:

**Development:**
```
http://your-ngrok-url.ngrok.io/api/v1/payments/webhooks/mercadopago
# or for payments-v2
http://your-ngrok-url.ngrok.io/api/v1/payments-v2/webhooks/mercadopago
```

**Production:**
```
https://your-domain.com/api/v1/payments/webhooks/mercadopago
# or for payments-v2
https://your-domain.com/api/v1/payments-v2/webhooks/mercadopago
```

### 4. Test Your Webhook

Use MercadoPago's webhook simulator in the developer portal to send test notifications and verify the signature validation is working.

## Development Mode

If `MERCAPAGO_WEBHOOK_SECRET` is **not configured**, the service will:
- Log a warning on startup
- **Skip signature validation** (for development only)
- Process webhooks normally

⚠️ **Warning**: Never deploy to production without configuring the webhook secret!

## Security Features

✅ **HMAC-SHA256 Signature Validation**: Cryptographically secure validation
✅ **Timing-Safe Comparison**: Prevents timing attacks
✅ **Request ID Verification**: Ensures request uniqueness
✅ **Timestamp Validation**: Includes timestamp in signature
✅ **Automatic Logging**: Logs validation failures with details

## Webhook Endpoints

### Legacy Payments System
```
POST /api/v1/payments/webhooks/mercadopago
```

### Payments V2 System
```
POST /api/v1/payments-v2/webhooks/mercadopago
```

Both endpoints now validate signatures before processing.

## Troubleshooting

### Webhook Validation Failing

1. **Check logs**: Look for validation error messages with details
2. **Verify secret**: Ensure `MERCAPAGO_WEBHOOK_SECRET` matches your dashboard
3. **Test manually**: Use MercadoPago's webhook simulator
4. **Check headers**: Ensure MercadoPago is sending `x-signature` and `x-request-id`

### Common Issues

**"Webhook secret not configured"**
- Add `MERCAPAGO_WEBHOOK_SECRET` to your `.env` file
- Restart your application

**"Invalid x-signature header format"**
- The signature header format has changed
- Contact MercadoPago support or check their updated documentation

**"Webhook signature validation failed"**
- Your secret key doesn't match
- Get a fresh secret from MercadoPago dashboard
- Update your `.env` file

## Implementation Details

The validation process:

1. Parse `x-signature` header to extract `ts` (timestamp) and `v1` (signature hash)
2. Build signature template: `id:{payment_id};request-id:{request_id};ts:{timestamp};`
3. Calculate HMAC-SHA256 hash using webhook secret
4. Compare calculated hash with received `v1` using constant-time comparison
5. Accept or reject webhook based on match

## Code Example

```typescript
// Automatic validation in controllers
@Post('webhooks/mercadopago')
async handleMercadoPagoWebhook(
  @Body() body: any,
  @Headers('x-signature') xSignature?: string,
  @Headers('x-request-id') xRequestId?: string,
) {
  // Validates automatically before processing
  if (xSignature && xRequestId && body.data?.id) {
    const isValid = this.mercadoPagoService.validateWebhookSignature(
      xSignature,
      xRequestId,
      body.data.id,
    );
    if (!isValid) {
      return { error: 'Invalid signature' };
    }
  }

  // Process webhook...
}
```

## References

- [MercadoPago Webhooks Documentation](https://www.mercadopago.com/developers/en/docs/checkout-api/additional-content/your-integrations/notifications/webhooks)
- [MercadoPago Security Best Practices](https://www.mercadopago.com/developers/en/docs/security)

---

**Last Updated**: 2025-01-20
**Version**: 1.0.0

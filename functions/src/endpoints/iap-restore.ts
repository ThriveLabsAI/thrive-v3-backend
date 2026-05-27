import { Request, Response } from 'express';
import { IAPRestoreRequestSchema, IAPVerifyResponseSchema } from '../schemas/responses';
import { verifyAppleReceipt, verifyGooglePlayToken } from '../utils/iap-verification';
import { storeEntitlement } from '../utils/firestore';

export async function iapRestoreHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.uid) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'AUTH_MISSING',
        requestId: req.metadata?.requestId || 'unknown',
        timestamp: Date.now(),
      });
      return;
    }

    // Validate request
    const validated = IAPRestoreRequestSchema.parse(req.body);
    const uid = req.user.uid;

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'iap_restore_started',
      uidHash: req.metadata?.uidHash,
      platform: validated.platform,
    }));

    let verificationResult;

    // Verify receipt/token with appropriate provider
    if (validated.platform === 'apple') {
      if (!validated.receipt) {
        res.status(400).json({
          error: 'Missing receipt for Apple restore',
          code: 'VALIDATION_ERROR',
          requestId: req.metadata?.requestId || 'unknown',
          timestamp: Date.now(),
        });
        return;
      }
      verificationResult = await verifyAppleReceipt(validated.receipt);
    } else if (validated.platform === 'google') {
      if (!validated.purchaseToken) {
        res.status(400).json({
          error: 'Missing purchaseToken for Google restore',
          code: 'VALIDATION_ERROR',
          requestId: req.metadata?.requestId || 'unknown',
          timestamp: Date.now(),
        });
        return;
      }
      // For Google, we need the productId which isn't in the restore request
      // In production, we'd look it up or require it
      verificationResult = await verifyGooglePlayToken('com.thrive.app', 'com.thrive.premium', validated.purchaseToken);
    } else {
      res.status(400).json({
        error: 'Invalid platform',
        code: 'VALIDATION_ERROR',
        requestId: req.metadata?.requestId || 'unknown',
        timestamp: Date.now(),
      });
      return;
    }

    // If verification failed, return error
    if (!verificationResult.valid) {
      res.status(400).json({
        error: verificationResult.error || 'Receipt verification failed',
        code: 'VERIFICATION_FAILED',
        requestId: req.metadata?.requestId || 'unknown',
        timestamp: Date.now(),
      });
      return;
    }

    // Store restored entitlement in Firestore
    await storeEntitlement(
      uid,
      verificationResult.platform,
      verificationResult.productId,
      verificationResult.transactionId,
      verificationResult.originalTransactionId,
      verificationResult.expiresAt || null
    );

    const response = {
      status: verificationResult.status,
      productId: verificationResult.productId,
      expiresAt: verificationResult.expiresAt?.toISOString(),
      message: `${verificationResult.platform} subscription restored successfully`,
      entitlementId: verificationResult.transactionId,
    };

    // Validate response
    const validatedResponse = IAPVerifyResponseSchema.parse(response);

    res.status(200).json(validatedResponse);

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'iap_restore_succeeded',
      uidHash: req.metadata?.uidHash,
      platform: verificationResult.platform,
      productId: verificationResult.productId,
      status: verificationResult.status,
    }));
  } catch (error) {
    console.error('IAP restore error:', error);

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }

    // Determine error code and message
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('validation')) {
        errorCode = 'VALIDATION_ERROR';
        statusCode = 400;
        errorMessage = 'Invalid request';
      }
    }

    res.status(statusCode).json({
      error: errorMessage,
      code: errorCode,
      requestId: req.metadata?.requestId || 'unknown',
      timestamp: Date.now(),
      debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined,
    });
  }
}

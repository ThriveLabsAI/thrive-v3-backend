import { Request, Response } from 'express';
import { IAPEntitlementResponseSchema } from '../schemas/responses';
import { getEntitlement } from '../utils/firestore';

export async function iapEntitlementHandler(req: Request, res: Response): Promise<void> {
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

    const uid = req.user.uid;

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'iap_entitlement_check',
      uidHash: req.metadata?.uidHash,
    }));

    // Fetch entitlement from Firestore
    const entitlementDoc = await getEntitlement(uid);

    // Determine if user has active premium subscription
    let isPremium = false;
    let expiresAt: string | undefined;

    if (entitlementDoc) {
      // Convert Firestore Timestamp to Date if needed
      const expiresAtValue = entitlementDoc.expiresAt;
      if (expiresAtValue) {
        const expiresDate = expiresAtValue.toDate ? expiresAtValue.toDate() : new Date(expiresAtValue);
        expiresAt = expiresDate.toISOString();
        isPremium = new Date() < expiresDate;

        // Update status if expired
        if (!isPremium && entitlementDoc.status === 'active') {
          entitlementDoc.status = 'expired';
        }
      }
    }

    const response = {
      uid,
      platform: entitlementDoc?.platform,
      productId: entitlementDoc?.productId,
      status: entitlementDoc?.status,
      expiresAt,
      isPremium,
      renewalAvailable: isPremium,
      verifiedAt: entitlementDoc?.verifiedAt?.toISOString ? entitlementDoc.verifiedAt.toISOString() : entitlementDoc?.verifiedAt,
    };

    // Validate response
    const validatedResponse = IAPEntitlementResponseSchema.parse(response);

    res.status(200).json(validatedResponse);

    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      requestId: req.metadata?.requestId,
      event: 'iap_entitlement_checked',
      uidHash: req.metadata?.uidHash,
      isPremium,
      status: entitlementDoc?.status,
    }));
  } catch (error) {
    console.error('IAP entitlement check error:', error);

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

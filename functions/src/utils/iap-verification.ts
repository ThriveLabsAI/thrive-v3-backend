// In-App Purchase (IAP) Receipt Verification
// Handles both Apple App Store and Google Play Store receipts

export interface IAPVerificationResult {
  valid: boolean;
  platform: 'apple' | 'google';
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  purchasedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'invalid';
  error?: string;
}

/**
 * Verify Apple App Store receipt
 * In production, this would validate against Apple's App Store Server API
 * For now, implements realistic mock verification
 */
export async function verifyAppleReceipt(receipt: string): Promise<IAPVerificationResult> {
  try {
    // In production:
    // 1. Parse receipt (base64)
    // 2. Call Apple App Store Server API: https://api.storekit.itunes.apple.com/inApps/v1/transactions/lookup/{originalTransactionId}
    // 3. Validate signature with Apple's public key
    // 4. Check expiration date

    // Mock implementation: simulate Apple response
    if (!receipt || receipt.length < 10) {
      return {
        valid: false,
        platform: 'apple',
        productId: '',
        transactionId: '',
        originalTransactionId: '',
        purchasedAt: new Date(),
        status: 'invalid',
        error: 'Invalid receipt format',
      };
    }

    // Simulate valid receipt parsing
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year subscription

    return {
      valid: true,
      platform: 'apple',
      productId: 'com.thrive.premium.yearly',
      transactionId: `apple_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      originalTransactionId: `orig_${receipt.substring(0, 32)}`,
      purchasedAt: now,
      expiresAt,
      status: 'active',
    };
  } catch (error) {
    return {
      valid: false,
      platform: 'apple',
      productId: '',
      transactionId: '',
      originalTransactionId: '',
      purchasedAt: new Date(),
      status: 'invalid',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify Google Play Store purchase token
 * In production, this would validate against Google Play Developer API
 * For now, implements realistic mock verification
 */
export async function verifyGooglePlayToken(
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<IAPVerificationResult> {
  try {
    // In production:
    // 1. Authenticate with Google service account
    // 2. Call Google Play Developer API:
    //    GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptions/{productId}/tokens/{token}
    // 3. Validate signature and expiration

    if (!purchaseToken || purchaseToken.length < 10) {
      return {
        valid: false,
        platform: 'google',
        productId,
        transactionId: '',
        originalTransactionId: '',
        purchasedAt: new Date(),
        status: 'invalid',
        error: 'Invalid purchase token',
      };
    }

    // Simulate valid token parsing
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days subscription

    return {
      valid: true,
      platform: 'google',
      productId,
      transactionId: `google_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      originalTransactionId: `google_orig_${purchaseToken.substring(0, 32)}`,
      purchasedAt: now,
      expiresAt,
      status: 'active',
    };
  } catch (error) {
    return {
      valid: false,
      platform: 'google',
      productId,
      transactionId: '',
      originalTransactionId: '',
      purchasedAt: new Date(),
      status: 'invalid',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if entitlement is still active
 */
export function isEntitlementActive(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  return new Date() < expiresAt;
}

/**
 * Get status based on expiration
 */
export function getEntitlementStatus(expiresAt?: Date): 'active' | 'expired' {
  return isEntitlementActive(expiresAt) ? 'active' : 'expired';
}

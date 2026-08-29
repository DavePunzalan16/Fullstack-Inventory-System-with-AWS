/**
 * Cognito JWT verifier factory (Req 11.10).
 *
 * Wraps `aws-jwt-verify` to produce a {@link TokenVerifier} bound to the
 * configured User Pool and App Client. JWKS keys are fetched and cached by the
 * library. Kept isolated so the rest of the app depends only on the
 * {@link TokenVerifier} interface, which tests can stub.
 */

import { CognitoJwtVerifier } from 'aws-jwt-verify';

import type { TokenVerifier, VerifiedClaims } from '../middleware/auth';

/** Configuration required to build the Cognito verifier. */
export interface CognitoConfig {
  readonly userPoolId: string;
  readonly clientId: string;
  /** `access` or `id` token use, per how the frontend sends tokens. */
  readonly tokenUse: 'access' | 'id';
}

/** Reads Cognito configuration from the environment. */
export function cognitoConfigFromEnv(
  source: NodeJS.ProcessEnv = process.env,
): CognitoConfig {
  const userPoolId = source.COGNITO_USER_POOL_ID?.trim() ?? '';
  const clientId = source.COGNITO_CLIENT_ID?.trim() ?? '';
  const tokenUse = source.COGNITO_TOKEN_USE?.trim() === 'id' ? 'id' : 'access';
  return { userPoolId, clientId, tokenUse };
}

/** Builds a {@link TokenVerifier} backed by the Cognito JWKS. */
export function createCognitoVerifier(config: CognitoConfig): TokenVerifier {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: config.userPoolId,
    tokenUse: config.tokenUse,
    clientId: config.clientId,
  });

  return async function verify(token: string): Promise<VerifiedClaims> {
    const payload = await verifier.verify(token);
    return payload as unknown as VerifiedClaims;
  };
}

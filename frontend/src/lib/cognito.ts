/**
 * Cognito sign-up / sign-in (Req 11.1–11.7) via amazon-cognito-identity-js.
 *
 * Reads pool configuration from NEXT_PUBLIC_COGNITO_* env vars. Exposes thin
 * promise-based wrappers so pages/components stay free of callback plumbing.
 */

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';

/** Builds the user pool from env config. */
function getUserPool(): CognitoUserPool {
  return new CognitoUserPool({
    UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? '',
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '',
  });
}

/** Result of a successful sign-in: the JWT to store + attach to requests. */
export interface SignInResult {
  idToken: string;
  accessToken: string;
}

/** Registers a new user (Req 11.1, 11.2). Rejects on Cognito errors (Req 11.4). */
export function signUp(email: string, password: string, name: string): Promise<void> {
  const pool = getUserPool();
  return new Promise((resolve, reject) => {
    pool.signUp(
      email,
      password,
      [{ Name: 'name', Value: name } as never],
      [],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      },
    );
  });
}

/** Authenticates a user, resolving to tokens on success (Req 11.5, 11.6). */
export function signIn(email: string, password: string): Promise<SignInResult> {
  const pool = getUserPool();
  const user = new CognitoUser({ Username: email, Pool: pool });
  const details = new AuthenticationDetails({ Username: email, Password: password });

  return new Promise((resolve, reject) => {
    user.authenticateUser(details, {
      onSuccess: (session: CognitoUserSession) => {
        resolve({
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
        });
      },
      onFailure: (err) => reject(err),
    });
  });
}

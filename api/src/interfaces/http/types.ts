/**
 * Auth context attached to requests by jwtAuth middleware.
 */
export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
}

/**
 * Express Request augmentation.
 * Controllers access auth via `(req as AuthenticatedRequest).auth`.
 */
export interface AuthenticatedRequest extends Express.Request {
  auth: AuthContext;
}

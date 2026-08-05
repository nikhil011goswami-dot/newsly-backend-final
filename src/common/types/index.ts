import { UserRole } from '@prisma/client';

// ── JWT ───────────────────────────────────────────────────────────────────────

/**
 * Payload embedded inside the access token.
 * `sessionId` lets JwtStrategy verify the session is still active on every request.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── Request augmentation ──────────────────────────────────────────────────────

/** Shape of `req.user` after JwtStrategy.validate() resolves. */
export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface RequestWithUser {
  user: RequestUser;
}

// ── File upload ───────────────────────────────────────────────────────────────

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// ── Resource ──────────────────────────────────────────────────────────────────

export class UserNotFoundException extends NotFoundException {
  constructor(identifier?: string) {
    super(identifier ? `User '${identifier}' not found` : 'User not found');
  }
}

export class ArticleNotFoundException extends NotFoundException {
  constructor(id?: string) {
    super(id ? `Article '${id}' not found` : 'Article not found');
  }
}

export class CategoryNotFoundException extends NotFoundException {
  constructor(id?: string) {
    super(id ? `Category '${id}' not found` : 'Category not found');
  }
}

export class DuplicateResourceException extends ConflictException {
  constructor(resource: string) {
    super(`${resource} already exists`);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super('Token has expired');
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid token');
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid email or password');
  }
}

export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    super('Please verify your email before logging in');
  }
}

export class AccountSuspendedException extends ForbiddenException {
  constructor() {
    super('Your account has been suspended');
  }
}

// ── Authorization ─────────────────────────────────────────────────────────────

export class InsufficientPermissionsException extends ForbiddenException {
  constructor() {
    super('You do not have permission to perform this action');
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

export class InvalidPasswordException extends BadRequestException {
  constructor(message = 'Invalid password') {
    super(message);
  }
}

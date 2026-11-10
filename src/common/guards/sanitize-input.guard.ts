import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

// Rejects MongoDB operator keys ($ne, $gt, ...) anywhere in user input to block NoSQL injection
function hasOperatorKey(value: unknown, depth = 0): boolean {
  if (depth > 20) return true;
  if (Array.isArray(value)) return value.some((item) => hasOperatorKey(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.entries(value).some(
      ([key, item]) =>
        key.startsWith('$') ||
        key.includes('[$') ||
        key === '__proto__' ||
        key === 'constructor' ||
        hasOperatorKey(item, depth + 1),
    );
  }
  return false;
}

@Injectable()
export class SanitizeInputGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (hasOperatorKey(request.body) || hasOperatorKey(request.query) || hasOperatorKey(request.params)) {
      throw new BadRequestException('Invalid input');
    }
    return true;
  }
}

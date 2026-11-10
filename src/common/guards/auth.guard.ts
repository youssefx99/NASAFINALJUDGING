import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../decorators/auth.decorators';

const USER_CACHE_MS = 30_000;
type AuthState = { role: string; passwordChangedAt?: Date; loadedAt: number };
const userCache = new Map<string, AuthState>();

// Global guard: every route requires a valid signed token and the admin role unless marked @Public / @Roles
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const [scheme, token] = String(request.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication required');
    }

    let payload: { sub: string; pv?: number };
    try {
      payload = await this.jwtService.verifyAsync(token, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
    if (!Types.ObjectId.isValid(payload.sub)) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    let state = userCache.get(payload.sub);
    if (!state || Date.now() - state.loadedAt > USER_CACHE_MS) {
      const user = await this.userModel
        .findById(payload.sub, { role: 1, passwordChangedAt: 1 })
        .lean()
        .exec();
      if (!user) {
        userCache.delete(payload.sub);
        throw new UnauthorizedException('Invalid or expired session');
      }
      state = { role: user.role, passwordChangedAt: user.passwordChangedAt, loadedAt: Date.now() };
      userCache.set(payload.sub, state);
    }
    // Sessions issued before the last password change are revoked
    if ((payload.pv || 0) !== (state.passwordChangedAt?.getTime() || 0)) {
      throw new UnauthorizedException('Session expired, please sign in again');
    }

    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, targets) || ['admin'];
    if (!roles.includes(state.role)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    request.user = { _id: payload.sub, role: state.role };
    return true;
  }
}

export function forgetCachedUser(userId: string) {
  userCache.delete(String(userId));
}

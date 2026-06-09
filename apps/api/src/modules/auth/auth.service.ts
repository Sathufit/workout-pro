import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../../schemas/user.schema';
import { RefreshToken } from '../../schemas/refresh-token.schema';
import { PasswordResetToken } from '../../schemas/password-reset.schema';
import { RegisterInput, ResetPasswordInput, ErrorCode } from '@workout-pro/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
    @InjectModel(PasswordResetToken.name) private passwordResetModel: Model<PasswordResetToken>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user || !user.passwordHash) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    return { id: user._id.toString(), email: user.email, name: user.name };
  }

  async register(input: RegisterInput) {
    const existing = await this.userModel.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new ConflictException({ code: ErrorCode.EMAIL_ALREADY_EXISTS, message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.userModel.create({
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
    });

    return this.issueTokens(user._id.toString(), user.email);
  }

  async login(userId: string, email: string) {
    return this.issueTokens(userId, email);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenModel.findOne({ tokenHash });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: ErrorCode.INVALID_TOKEN });
    }

    await this.refreshTokenModel.updateOne({ _id: stored._id }, { revokedAt: new Date() });

    const user = await this.userModel.findOne({ _id: stored.userId, isActive: true });
    if (!user) throw new UnauthorizedException();

    return this.issueTokens(user._id.toString(), user.email);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenModel.updateMany(
      { tokenHash, revokedAt: { $exists: false } },
      { revokedAt: new Date() },
    );
  }

  async getMe(userId: string) {
    return this.userModel.findById(userId).select('id email name avatarUrl timezone unitSystem').lean();
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) return; // prevent email enumeration

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.passwordResetModel.create({ userId: user._id.toString(), tokenHash, expiresAt });
    // TODO: send email via Resend with reset link containing token
  }

  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = this.hashToken(input.token);
    const record = await this.passwordResetModel.findOne({ tokenHash });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException({ code: ErrorCode.TOKEN_EXPIRED, message: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    await Promise.all([
      this.userModel.updateOne({ _id: record.userId }, { passwordHash }),
      this.passwordResetModel.updateOne({ _id: record._id }, { usedAt: new Date() }),
      this.refreshTokenModel.updateMany(
        { userId: record.userId, revokedAt: { $exists: false } },
        { revokedAt: new Date() },
      ),
    ]);
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    // Secret and expiresIn come from JwtModule.registerAsync config — no override needed
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.refreshTokenModel.create({ userId, tokenHash, expiresAt });
    return { accessToken, refreshToken, userId };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

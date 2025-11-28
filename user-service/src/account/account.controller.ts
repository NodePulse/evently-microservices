import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AccountService } from './account.service';

class FirebaseAuthDto {
  idToken: string;
}

@Controller('account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private accountService: AccountService) {}

  /**
   * Firebase Authentication
   * Frontend sends Firebase ID token, backend verifies and creates/links user
   */
  @Post('firebase/verify')
  async firebaseAuth(
    @Body() body: FirebaseAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.accountService.verifyFirebaseToken(
        body.idToken,
        res,
      );

      return result;
    } catch (error) {
      this.logger.error('Firebase auth error:', error);
      throw error;
    }
  }
}

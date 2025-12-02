import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfileDetails(headers: any) {
    const userId = headers['x-user-id'];

    if (!userId) {
      return {
        status: 400,
        message: 'User ID not found',
        data: null,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: true },
    });

    if (!user) {
      return {
        status: 404,
        message: 'User not found',
        data: null,
      };
    }

    return {
      status: 200,
      message: 'Profile details retrieved successfully',
      data: {
        ...user,
      },
    };
  }
}

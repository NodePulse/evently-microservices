import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../constants/errorCodes';
import { AppResponse } from '../utils/AppResponse';

export const ProfileService = {
  getProfileDetails: async (headers: any) => {
    const userId = headers['x-user-id'];

    if (!userId) {
      throw new AppError(ERROR_CODES.INVALID_INPUT);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        gender: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND);
    }

    return new AppResponse(200, 'Profile details retrieved successfully', user);
  },
};

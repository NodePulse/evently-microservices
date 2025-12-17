import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { catchAsync } from '../utils/catchAsync';

export const ProfileController = {
  getProfileDetails: catchAsync(async (req: Request, res: Response) => {
    const result = await ProfileService.getProfileDetails(req.headers);
    res.status(result.status).json(result);
  }),
};

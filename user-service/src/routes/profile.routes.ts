import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';

const router = Router();

router.get('/details', ProfileController.getProfileDetails);

export default router;

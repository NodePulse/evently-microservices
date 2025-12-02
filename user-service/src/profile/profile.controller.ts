import { Controller, Get, Headers } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('details')
  getProfile(@Headers() headers: any) {
    return this.profileService.getProfileDetails(headers);
  }
}

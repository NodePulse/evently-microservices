interface ErrorCodes {
  name: string;
  message: string;
  code: number;
}

interface AccessTokenPayload {
  userId: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN' | 'ORGANIZER';
}

interface UserResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  gender: string;
  image: string;
  role: 'USER' | 'ADMIN' | 'ORGANIZER';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

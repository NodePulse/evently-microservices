import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    console.log("JWT_ACCESS_SECRET exists:", !!process.env.JWT_ACCESS_SECRET);
    console.log(
      "JWT_ACCESS_SECRET length:",
      process.env.JWT_ACCESS_SECRET?.length
    );
    const jwtSecret = configService.get("JWT_ACCESS_SECRET");
    console.log(
      "🔑 JWT_ACCESS_SECRET loaded:",
      jwtSecret ? `${jwtSecret.substring(0, 10)}...` : "UNDEFINED!"
    );

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First, try to extract from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // If not found, extract from cookie
        (request) => {
          if (request && request.cookies) {
            return request.cookies.accessToken;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  }
}

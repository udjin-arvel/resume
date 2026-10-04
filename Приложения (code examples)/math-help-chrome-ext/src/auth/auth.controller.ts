import {
  Body,
  Controller,
  Get,
  Post,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../cfg";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { use } from "passport";
import { decode } from "node:punycode";
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  // Validate and decode a JWT
  @Get("verify")
  async verifyToken(@Headers("authorization") authHeader: string) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      this.logger.warn("Token not found");
      throw new UnauthorizedException("Token not found");
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = this.jwtService.verify(token, {
        secret: "demo-jwt-secret",
      });
      return { isValid: true, user: decoded };
    } catch (e) {
      this.logger.warn(`Invalid or expired token ${token}`);
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  // Exchange authorization code for token and return app's JWT
  @Post("google/token")
  async getToken(@Body() body: { code: string; redirectUri: string }) {
    const { code, redirectUri } = body;

    try {
      // Exchange code for Google access token
      const tokenResponse = await lastValueFrom(
        this.httpService.post("https://oauth2.googleapis.com/token", {
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      );

      const accessToken = tokenResponse.data.access_token;

      // Fetch user info using access token
      const userInfoResponse = await lastValueFrom(
        this.httpService.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      const userData = userInfoResponse.data;

      // Create or update user in your database
      const user = await this.usersService.findOrCreate({
        email: userData.email,
        googleId: userData.sub,
        firstName: userData.given_name,
        lastName: userData.family_name,
      });

      // Generate JWT for your application
      const jwtToken = this.jwtService.sign(
        { user },
        { expiresIn: "33d" },
      );

      return { user, token: jwtToken };
    } catch (error) {
      console.error("Error exchanging Google token:", error.message);
      this.logger.error("Error exchanging Google token:", error.message);
      throw new UnauthorizedException("Failed to exchange authorization code");
    }
  }
}

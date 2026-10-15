// src/auth/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { UsersService } from "../users/users.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(" ")[1];
    console.log(token);

    if (!token) {
      console.log("Неверный токен");
      return false;
    }

    try {
      const u = await this.usersService.getMe(token);
      const user = await this.usersService.findByGoogleId(u.googleId);
      if (!user) {
        console.log("Неверный токен");
        return false;
      }

      request["user"] = user;
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}

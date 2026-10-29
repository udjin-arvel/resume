import { Controller, Get, Post, Param } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.strategy";
import { CurrentUser } from "../auth/current-user.decorator";
import { User } from "../entities/User.entity";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @UseGuards(JwtAuthGuard)
  // @Get("me/attempts")
  // async myAttempts(@CurrentUser() user: User) {
  //   return { attemptsLeft: user.attemptsLeft ?? 0 };
  // }
  //
  // @Get(":email/attempts")
  // async getFreeAttempts(@Param("email") email: string) {
  //   const attemptsLeft = await this.usersService.getFreeAttempts(email);
  //   return { email, attemptsLeft };
  // }
  //
  //
  // @Post(":email/use-attempt")
  // async useAttempt(@Param("email") email: string) {
  //   const user = await this.usersService.updateAttempts(email, 1);
  //   return { email, attemptsLeft: user?.attemptsLeft };
  // }
  //
  // @Post(":email/logout")
  // async logout(@Param("email") email: string) {
  //   await this.usersService.logout(email);
  //   return { message: `User ${email} logged out successfully` };
  // }
}

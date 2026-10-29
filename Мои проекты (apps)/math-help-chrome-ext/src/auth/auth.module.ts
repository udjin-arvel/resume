import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { GoogleStrategy } from "./google.strategy";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "src/users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { HttpModule } from "@nestjs/axios";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    PassportModule.register({ session: false }),
    ConfigModule,
    UsersModule,
    HttpModule,
    JwtModule.register({
      secret: "demo-jwt-secret",
      signOptions: {
        expiresIn: "3d",
      },
    }),
  ],
  controllers: [AuthController],
  providers: [GoogleStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}

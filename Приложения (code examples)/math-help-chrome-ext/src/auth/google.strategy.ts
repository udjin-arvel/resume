import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { User } from "src/entities/User.entity";
import { UsersService } from "src/users/users.service";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_EXT_ID } from "../cfg";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    configService: ConfigService,
    private userService: UsersService,
    private jwtService: JwtService,
  ) {
    super({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `https://${GOOGLE_EXT_ID}.chromiumapp.org/`, // TODO редирект на страницу, после реги
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;

    const user: Partial<User> = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      googleId: id,
      attemptsLeft: 10,
      attemptsCount: 0,
    };

    try {
      // const savedUser = await this.userService.findOrCreate(user, id);
      const savedUser = await this.userService.findOrCreate(user);
      const jwtToken = this.jwtService.sign({ googleId: savedUser.googleId });

      done(null, { user: savedUser, token: jwtToken });
      // done(null, profile); // accessToken
    } catch (e) {
      console.log(e);
      done(e, false);
    }
  }
}

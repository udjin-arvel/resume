import { Injectable, UnauthorizedException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AuthService {
  constructor(private readonly httpService: HttpService) {}

  async validateGoogleToken(token: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`,
        ),
      );

      return response.data; // Данные о пользователе, если токен валиден
    } catch (error) {
      throw new UnauthorizedException("Недействительный токен");
    }
  }
}

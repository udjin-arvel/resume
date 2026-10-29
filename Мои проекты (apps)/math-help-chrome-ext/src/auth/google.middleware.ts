import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service"; // Импортируем сервис для валидации токенов

@Injectable()
export class GoogleAuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Токен не найден");
    }

    const token = authHeader.split(" ")[1]; // Извлекаем токен из заголовка Authorization

    try {
      const googleUserData = await this.authService.validateGoogleToken(token);
      req.user = googleUserData; // Сохраняем данные пользователя в объект запроса
      console.log(req.user);
      next(); // Переходим к следующему middleware или контроллеру
    } catch (error) {
      throw new UnauthorizedException("Недействительный токен");
    }
  }
}

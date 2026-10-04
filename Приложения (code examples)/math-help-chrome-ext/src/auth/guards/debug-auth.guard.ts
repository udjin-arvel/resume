import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";

@Injectable()
export class DebugAuthGuard extends AuthGuard("google") implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const debug = process.env.DEBUG_AUTH === "true";
    const request = context.switchToHttp().getRequest();

    if (debug) {
      // Назначаем фиктивного пользователя
      request.user = {
        user: {
          id: "debug-user-id",
          email: "debug@example.com",
          firstName: "Debug",
          lastName: "User",
          googleId: "debug-google-id",
        },
        token: "debug-jwt-token",
      };
      return true;
    }

    // В противном случае используем стандартный AuthGuard
    return super.canActivate(context);
  }
}

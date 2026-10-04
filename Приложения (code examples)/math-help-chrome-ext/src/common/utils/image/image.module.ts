import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { ImageController } from "./image.controller";
import { OpenAiService } from "../open-ai/open-ai.service";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "src/users/users.module";
import { GoogleAuthMiddleware } from "src/auth/google.middleware";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [
    JwtModule.register({
      secret: "demo-jwt-secret",
      signOptions: {
        expiresIn: "3d",
      },
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [ImageController],
  providers: [OpenAiService],
})
export class ImageModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GoogleAuthMiddleware)
      .forRoutes({ path: "/image", method: RequestMethod.ALL });
  }
}

import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { HttpService } from "@nestjs/axios";
import { UsersService } from "../users/users.service";

describe("AuthController", () => {
  let authController: AuthController;

  const mockAuthService = {
    validateGoogleToken: jest.fn(),
  };

  const mockUsersService = {
    findOrCreate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        JwtService,
        HttpService,
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(authController).toBeDefined();
  });

  it("should handle Google token exchange", async () => {
    const mockBody = { code: "test-code"  };
    mockAuthService.validateGoogleToken.mockResolvedValue({
      email: "test@test.com",
    });
    mockUsersService.findOrCreate.mockResolvedValue({
      id: 1,
      email: "test@test.com",
    });

    const result = await authController.getToken({redirectUri: "", code:"test-code"});
    expect(result).toHaveProperty("user");
    expect(result).toHaveProperty("token");
  });
});

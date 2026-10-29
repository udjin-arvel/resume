import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  Res,
  ForbiddenException,
} from "@nestjs/common";
import { OpenAiService } from "../open-ai/open-ai.service";
import { UsersService } from "../../../users/users.service";
import { Request } from "express";
import { Response } from 'express';
import { JwtService } from "@nestjs/jwt";
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import ChatCompletion from "openai";

interface IOpenAIChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
  index: number;
}

interface IOpenAIResponse {
  choices: IOpenAIChoice[];
}

@Controller("image")
export class ImageController {
  private readonly logger = new Logger(ImageController.name);
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @HttpCode(200)
  @Post("upload")
  async handleScreenshot(
    @Body("url") url: string,
    @Body("way") way: string,
    @Body("language") lang: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Starting handleScreenshot...');
      
      // Extract and verify the token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedException("Authorization token is missing or invalid");
      }

      const token = authHeader.split(" ")[1];
      let userId: string;
      try {
        const decoded = this.jwtService.verify(token, {
          secret: "demo-jwt-secret",
        });
        userId = decoded.user.googleId;
      } catch (err) {
        this.logger.error('Token verification failed:', err);
        throw new UnauthorizedException("Token is invalid or expired");
      }

      // Fetch the user by their ID
      const user = await this.usersService.findByGoogleId(userId);
      if (!user) {
        this.logger.warn(`User not found id-${userId}`);
        throw new UnauthorizedException("User not found");
      }
      if (!(await this.usersService.hasBalance(user))) {
        this.logger.warn(`No attempts on account ${user.email}`);
        throw new ForbiddenException("No attempts on account");
      }

      // Set up streaming response
      this.logger.log('Setting up streaming response...');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if using Nginx

      // Process the screenshot with GPT using streaming
      this.logger.log(`Processing with ${way} mode...`);
      let stream;
      if (way === "fast") {
        stream = await this.openAiService.askGPTStream(url, lang);
      } else if (way === "complex") {
        stream = await this.openAiService.ask2stepStream(url, lang);
      } else {
        throw new Error("Invalid way parameter");
      }

      // Update user's attempts
      const updatedUser = await this.usersService.useAttempt(user, 1);
      this.logger.log(`Updated attempts for user ${user.email}: ${updatedUser.attemptsLeft}`);

      // Handle the stream
      this.logger.log('Starting stream processing...');
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            this.logger.debug(`Sending chunk: ${content}`);
            // Send chunk as JSON with data: prefix for SSE
            res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
          }
        }
        
        // Send final message with attempts left
        this.logger.log('Stream completed, sending final message...');
        res.write(`data: ${JSON.stringify({ attemptsLeft: updatedUser.attemptsLeft })}\n\n`);
        res.end();
        this.logger.log('Response completed successfully');
      } catch (streamError) {
        this.logger.error('Error processing stream:', streamError);
        if (!res.headersSent) {
          res.status(500).json({
            error: "Error processing the response stream",
          });
        } else {
          res.end();
        }
      }
    } catch (error) {
      this.logger.error('Error in handleScreenshot:', error);
      if (!res.headersSent) {
        if (error instanceof ForbiddenException) {
          res.status(403).json({
            error: "No attempts on account. Please purchase more attempts.",
          });
        } else {
          res.status(401).json({
            error: "Failed to process the screenshot. Please try again.",
          });
        }
      } else {
        res.end();
      }
    }
  }
}

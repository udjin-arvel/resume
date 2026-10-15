// src/common/utils/open-ai/open-ai.service.ts
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
// import { join } from "path";
import { promises as fs } from "fs";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "src/cfg";
// import { readFile } from "fs/promises";
const INFERENCEMODEL='gpt-4o-mini'; // old - gpt-4o-2024-11-20
@Injectable()
export class OpenAiService implements OnModuleInit {
  private readonly logger = new Logger(OpenAiService.name);

  /** содержимое prompt.txt для быстрого режима */
  private promptFast: string;

  /** содержимое o1prompt.txt для «двухшагового» режима */
  private promptO1: string;

  /** инициализация сервиса: читаем файлы только один раз */
  async onModuleInit() {
    try {
      const promptPath  =  "./prompt.txt";
      const o1PromptPath = "./o1prompt.txt";

      // читаем оба файла параллельно
      const [fast, complex] = await Promise.all([
        fs.readFile(promptPath, "utf8"),
        fs.readFile(o1PromptPath, "utf8"),
      ]);

      this.promptFast = fast;
      this.promptO1   = complex;
      this.logger.log("Prompts loaded into memory");
    } catch (err) {
      this.logger.error("Failed to read prompt files", err);
      throw err;
    }
  }

  /** быстрый однопроходный запрос с поддержкой стриминга */
  async askGPTStream(url: string, lang: string) {
    this.logger.log(`Usage GPT Model: ${INFERENCEMODEL}. Starting askGPTStream...`);
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    try {
      this.logger.log('Creating completion with streaming...');
      const stream = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: this.promptFast },
              { type: "image_url", image_url: { url } },
            ],
          },
        ],
        model:INFERENCEMODEL,
        stream: true,
        max_tokens: 4096,
      });
      
      this.logger.log('Stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error('Error in askGPTStream:', error);
      throw error;
    }
  }

  /** быстрый однопроходный запрос (legacy) */
  async askGPT(url: string, lang: string) {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    return openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: this.promptFast },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
      model: INFERENCEMODEL,
    });
  }

  /** двухшаговый режим с поддержкой стриминга */
  async ask2stepStream(url: string, lang: string) {
    const first = await this.decodeProblemGPT(url);
    const extracted = first.choices[0]?.message.content?.trim();
    if (!extracted) {
      throw new Error("Could not extract task from image");
    }
    return this.askOModelGPTStream(extracted, lang);
  }

  /** двухшаговый режим (legacy) */
  async ask2step(url: string, lang: string) {
    const first = await this.decodeProblemGPT(url);
    const extracted = first.choices[0]?.message.content?.trim();
    if (!extracted) {
      return {
        choices: [
          { message: { content: "Could not extract task from image" } },
        ],
      };
    }
    return this.askOModelGPT(extracted, lang);
  }

  private async decodeProblemGPT(url: string) {
    this.logger.log('Starting decodeProblemGPT...');
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    try {
      const response = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the mathematical problem from this image. Return only the problem, no explanations." },
              { type: "image_url", image_url: { url } },
            ],
          },
        ],
        model:INFERENCEMODEL,
        max_tokens: 1000,
      });
      this.logger.log('Problem decoded successfully');
      return response;
    } catch (error) {
      this.logger.error('Error in decodeProblemGPT:', error);
      throw error;
    }
  }

  private async askOModelGPTStream(problem: string, lang: string) {
    this.logger.log('Starting askOModelGPTStream...');
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    try {
      const stream = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Equation:\n${problem}\n${this.promptO1}`,
          },
        ],
        model: "gpt-4o-2024-11-20",
        stream: true,
        max_tokens: 4096,
      });
      
      this.logger.log('Stream created successfully');
      return stream;
    } catch (error) {
      this.logger.error('Error in askOModelGPTStream:', error);
      throw error;
    }
  }

  private async askOModelGPT(problem: string, lang: string) {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    return openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Equation:\n${problem}\n${this.promptO1}` },
          ],
        },
      ],
      model: "o1-mini-2024-09-12",
    });
  }
}

import type {
  AppQuestionDrawQuery,
  AppQuestionDrawResponse,
  AppThemeListResponse,
} from "@mentis/contracts/app";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ENV, type Env } from "../../_config/env.config";
import { toAppQuestionDrawResponse, toAppThemeListResponse } from "../mappers/catalog.mapper";
import {
  CatalogRepository,
  type DrawnQuestion,
  type ThemeWithQuestionCount,
} from "../repositories/catalog.repository";

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async listThemes(): Promise<AppThemeListResponse> {
    return toAppThemeListResponse(
      await this.catalogRepository.themesWithQuestionCounts(),
      this.env.SUPABASE_URL,
    );
  }

  async drawQuestions(query: AppQuestionDrawQuery): Promise<AppQuestionDrawResponse> {
    // An unknown Theme and a Theme with no Questions both draw nothing, so the 404 is decided first.
    if (query.theme !== undefined && !(await this.catalogRepository.themeExists(query.theme))) {
      throw new NotFoundException({
        code: "THEME_NOT_FOUND",
        message: `Unknown theme: ${query.theme}`,
      });
    }
    return toAppQuestionDrawResponse(
      await this.catalogRepository.drawRandomQuestions(query.theme ?? null, query.n),
    );
  }

  // Competition draws through these three, so a Theme or Question row stays this feature's alone.
  themesWithQuestionCounts(): Promise<ThemeWithQuestionCount[]> {
    return this.catalogRepository.themesWithQuestionCounts();
  }

  drawFromTheme(themeId: string, count: number): Promise<DrawnQuestion[]> {
    return this.catalogRepository.drawRandomQuestions(themeId, count);
  }

  questionsByIds(ids: string[]): Promise<DrawnQuestion[]> {
    return this.catalogRepository.questionsByIds(ids);
  }
}

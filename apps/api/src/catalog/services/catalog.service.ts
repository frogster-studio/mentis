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
  type StoredThemeVisuals,
} from "../repositories/catalog.repository";
import type { ThemeVisuals } from "../types/theme-visuals";
import type { ThemeWithQuestionCount } from "../types/theme-with-question-count";
import { themeImageUrl } from "../utils/theme-image-url";

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async listThemes(): Promise<AppThemeListResponse> {
    return toAppThemeListResponse(await this.themesWithQuestionCounts());
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

  // Competition draws through these four, so a Theme or Question row stays this feature's alone.
  async themesWithQuestionCounts(): Promise<ThemeWithQuestionCount[]> {
    const themes = await this.catalogRepository.themesWithQuestionCounts();
    return themes.map(({ id, name, questionCount, ...stored }) => ({
      id,
      name,
      questionCount,
      ...this.visuals(stored),
    }));
  }

  drawFromTheme(themeId: string, count: number): Promise<DrawnQuestion[]> {
    return this.catalogRepository.drawRandomQuestions(themeId, count);
  }

  questionsByIds(ids: string[]): Promise<DrawnQuestion[]> {
    return this.catalogRepository.questionsByIds(ids);
  }

  async themeVisuals(themeId: string): Promise<ThemeVisuals | null> {
    const stored = await this.catalogRepository.themeVisualsById(themeId);
    return stored === null ? null : this.visuals(stored);
  }

  // The bucket path is stored, the URL is not: composing it here keeps storage out of every mapper.
  private visuals({ image, category }: StoredThemeVisuals): ThemeVisuals {
    return { imageUrl: themeImageUrl(this.env.SUPABASE_URL, image), category };
  }
}

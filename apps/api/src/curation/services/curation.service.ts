import {
  type AdminCategoryListResponse,
  type AdminQuestionListQuery,
  type AdminQuestionListResponse,
  type AdminThemeListResponse,
  adminCategoryListResponseSchema,
  adminQuestionListResponseSchema,
  adminThemeListResponseSchema,
} from "@mentis/contracts/admin";
import { Injectable } from "@nestjs/common";
import { CurationRepository } from "../repositories/curation.repository";

@Injectable()
export class CurationService {
  constructor(private readonly curationRepository: CurationRepository) {}

  async listCategories(): Promise<AdminCategoryListResponse> {
    const categories = await this.curationRepository.listCategories();
    return adminCategoryListResponseSchema.parse(categories);
  }

  async listThemes(): Promise<AdminThemeListResponse> {
    const themes = await this.curationRepository.listThemes();
    return adminThemeListResponseSchema.parse(themes);
  }

  async listQuestions(query: AdminQuestionListQuery): Promise<AdminQuestionListResponse> {
    const questions = await this.curationRepository.listQuestions(query.themeId);
    return adminQuestionListResponseSchema.parse(questions);
  }
}

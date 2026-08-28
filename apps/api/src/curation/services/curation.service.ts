import {
  type AdminCategoryListResponse,
  type AdminQuestionListQuery,
  type AdminQuestionListResponse,
  type AdminQuestionResponse,
  type AdminQuestionWrite,
  type AdminThemeListResponse,
  adminCategoryListResponseSchema,
  adminQuestionListResponseSchema,
  adminQuestionResponseSchema,
  adminThemeListResponseSchema,
} from "@mentis/contracts/admin";
import { Injectable, NotFoundException } from "@nestjs/common";
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
    return adminThemeListResponseSchema.parse(
      themes.map(({ entity, questionCount, readyQuestionCount }) => ({
        ...entity,
        questionCount,
        readyQuestionCount,
      })),
    );
  }

  async listQuestions(query: AdminQuestionListQuery): Promise<AdminQuestionListResponse> {
    const questions = await this.curationRepository.listQuestions(query.themeId);
    return adminQuestionListResponseSchema.parse(questions);
  }

  async createQuestion(question: AdminQuestionWrite): Promise<AdminQuestionResponse> {
    // Authoring never stages: a new Question waits for the Editor's Ready flip.
    const created = await this.curationRepository.createQuestion({
      ...question,
      readyToBePublished: false,
    });
    return adminQuestionResponseSchema.parse(created);
  }

  async updateQuestion(id: string, question: AdminQuestionWrite): Promise<AdminQuestionResponse> {
    const updated = await this.curationRepository.updateQuestion({ id, ...question });
    if (updated === null) {
      throw new NotFoundException({ message: `Unknown question: ${id}` });
    }
    return adminQuestionResponseSchema.parse(updated);
  }

  async deleteQuestion(id: string): Promise<void> {
    if (!(await this.curationRepository.deleteQuestion(id))) {
      throw new NotFoundException({ message: `Unknown question: ${id}` });
    }
  }
}

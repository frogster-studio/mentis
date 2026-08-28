import {
  type AdminCategoryListResponse,
  type AdminCategoryResponse,
  type AdminCategoryWrite,
  type AdminQuestionListQuery,
  type AdminQuestionListResponse,
  type AdminQuestionResponse,
  type AdminQuestionWrite,
  type AdminThemeListResponse,
  type AdminThemeResponse,
  type AdminThemeWrite,
  adminCategoryListResponseSchema,
  adminCategoryResponseSchema,
  adminQuestionListResponseSchema,
  adminQuestionResponseSchema,
  adminThemeListResponseSchema,
  adminThemeResponseSchema,
} from "@mentis/contracts/admin";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CurationRepository } from "../repositories/curation.repository";
import { slugify } from "../utils/slugify";

@Injectable()
export class CurationService {
  constructor(private readonly curationRepository: CurationRepository) {}

  async listCategories(): Promise<AdminCategoryListResponse> {
    const categories = await this.curationRepository.listCategories();
    return adminCategoryListResponseSchema.parse(categories);
  }

  async createCategory(category: AdminCategoryWrite): Promise<AdminCategoryResponse> {
    const slug = this.slugOf(category.name, "Category");
    return adminCategoryResponseSchema.parse(
      await this.curationRepository.createCategory({ ...category, slug }),
    );
  }

  // The slug stays out of the write: renaming a Category must never move the key the Catalog stores.
  async updateCategory(id: string, category: AdminCategoryWrite): Promise<AdminCategoryResponse> {
    const updated = await this.curationRepository.updateCategory({ id, ...category });
    if (updated === null) {
      throw new NotFoundException({ message: `Unknown category: ${id}` });
    }
    return adminCategoryResponseSchema.parse(updated);
  }

  async deleteCategory(id: string): Promise<void> {
    if (!(await this.curationRepository.deleteCategory(id))) {
      throw new NotFoundException({ message: `Unknown category: ${id}` });
    }
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

  async createTheme(theme: AdminThemeWrite): Promise<AdminThemeResponse> {
    const slug = this.slugOf(theme.name, "Theme");
    // Authoring never stages: a new Theme waits for the Editor's Published switch.
    return adminThemeResponseSchema.parse(
      await this.curationRepository.createTheme({ ...theme, slug, published: false }),
    );
  }

  // The slug stays out of the write: renaming a Theme must never move the key the Catalog stores.
  async updateTheme(id: string, theme: AdminThemeWrite): Promise<AdminThemeResponse> {
    const updated = await this.curationRepository.updateTheme({ id, ...theme });
    if (updated === null) {
      throw new NotFoundException({ message: `Unknown theme: ${id}` });
    }
    return adminThemeResponseSchema.parse(updated);
  }

  async deleteTheme(id: string): Promise<void> {
    if (!(await this.curationRepository.deleteTheme(id))) {
      throw new NotFoundException({ message: `Unknown theme: ${id}` });
    }
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

  private slugOf(name: string, kind: "Category" | "Theme"): string {
    const slug = slugify(name);
    if (slug === "") {
      throw new BadRequestException({
        message: `A ${kind} name needs a letter or a digit: ${name}`,
      });
    }
    return slug;
  }
}

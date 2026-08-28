import {
  type AdminCategoryListResponse,
  type AdminCategoryResponse,
  type AdminCategoryWrite,
  type AdminQuestionListQuery,
  type AdminQuestionListResponse,
  type AdminQuestionResponse,
  type AdminQuestionWrite,
  type AdminThemeListResponse,
  adminCategoryListResponseSchema,
  adminCategoryResponseSchema,
  adminQuestionListResponseSchema,
  adminQuestionResponseSchema,
  adminThemeListResponseSchema,
} from "@mentis/contracts/admin";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CategoryHoldsThemesError,
  CategoryNameTakenError,
  CurationRepository,
} from "../repositories/curation.repository";
import { slugify } from "../utils/slugify";

@Injectable()
export class CurationService {
  constructor(private readonly curationRepository: CurationRepository) {}

  async listCategories(): Promise<AdminCategoryListResponse> {
    const categories = await this.curationRepository.listCategories();
    return adminCategoryListResponseSchema.parse(categories);
  }

  async createCategory(category: AdminCategoryWrite): Promise<AdminCategoryResponse> {
    const slug = slugify(category.name);
    if (slug === "") {
      throw new BadRequestException({
        message: `A Category name needs a letter or a digit: ${category.name}`,
      });
    }
    try {
      return adminCategoryResponseSchema.parse(
        await this.curationRepository.createCategory({ ...category, slug }),
      );
    } catch (error) {
      if (error instanceof CategoryNameTakenError) {
        throw new ConflictException({ message: `A Category is already named ${category.name}` });
      }
      throw error;
    }
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
    try {
      if (!(await this.curationRepository.deleteCategory(id))) {
        throw new NotFoundException({ message: `Unknown category: ${id}` });
      }
    } catch (error) {
      if (error instanceof CategoryHoldsThemesError) {
        throw new ConflictException({ message: `Category ${id} still holds Themes` });
      }
      throw error;
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

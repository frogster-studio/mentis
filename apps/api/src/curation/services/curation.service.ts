import {
  type AdminCategoryListResponse,
  type AdminCategoryResponse,
  type AdminCategoryWrite,
  type AdminQuestionListQuery,
  type AdminQuestionListResponse,
  type AdminQuestionResponse,
  type AdminQuestionStaging,
  type AdminQuestionWrite,
  type AdminThemeListResponse,
  type AdminThemeResponse,
  type AdminThemeStaging,
  type AdminThemeWrite,
  adminCategoryListResponseSchema,
  adminCategoryResponseSchema,
  adminQuestionListResponseSchema,
  adminQuestionResponseSchema,
  adminThemeListResponseSchema,
  adminThemeResponseSchema,
  DEFAULT_THEME_IMAGE,
} from "@mentis/contracts/admin";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CurationRepository } from "../repositories/curation.repository";
import { slugify } from "../utils/slugify";
import { ThemeImageService } from "./theme-image.service";

@Injectable()
export class CurationService {
  constructor(
    private readonly curationRepository: CurationRepository,
    private readonly themeImages: ThemeImageService,
  ) {}

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
    const id = await this.themeImages.authorize(theme);
    return adminThemeResponseSchema.parse(
      await this.curationRepository.createTheme({
        id,
        name: theme.name,
        categoryId: theme.categoryId,
        image: theme.image,
        slug,
        published: false,
      }),
    );
  }

  async updateTheme(id: string, theme: AdminThemeWrite): Promise<AdminThemeResponse> {
    const stored = await this.curationRepository.findTheme(id);
    if (stored === null) throw new NotFoundException({ message: `Unknown theme: ${id}` });
    if (theme.expectedImage !== undefined && theme.expectedImage !== stored.image) {
      throw new ConflictException("L’image a changé. Rechargez le thème avant de réessayer.");
    }
    await this.themeImages.authorize(theme, stored);
    const updated = await this.curationRepository.updateTheme(
      { id, name: theme.name, categoryId: theme.categoryId, image: theme.image },
      stored,
    );
    if (updated === null) throw new NotFoundException({ message: `Unknown theme: ${id}` });
    const cleanupToken = await this.themeImages.cleanupAfterSave(updated, stored.image);
    return adminThemeResponseSchema.parse({ ...updated, cleanupToken });
  }

  async resetThemeImage(id: string, expectedImage: string): Promise<AdminThemeResponse> {
    const stored = await this.curationRepository.findTheme(id);
    if (stored === null) throw new NotFoundException("Thème introuvable.");
    if (stored.image === DEFAULT_THEME_IMAGE)
      throw new BadRequestException("Le thème utilise déjà l’image par défaut.");
    if (stored.image !== expectedImage)
      throw new ConflictException("L’image a changé. Rechargez le thème avant de réessayer.");
    const updated = await this.curationRepository.updateTheme(
      { id, image: DEFAULT_THEME_IMAGE },
      stored,
    );
    if (updated === null) throw new NotFoundException("Thème introuvable.");
    const cleanupToken = await this.themeImages.cleanupAfterSave(updated, stored.image);
    return adminThemeResponseSchema.parse({ ...updated, cleanupToken });
  }

  // ADR 0008: the switch is stored as sent — no count is recomputed and no threshold is checked here.
  async stageTheme(id: string, { published }: AdminThemeStaging): Promise<AdminThemeResponse> {
    const staged = await this.curationRepository.stageTheme({ id, published });
    if (staged === null) {
      throw new NotFoundException({ message: `Unknown theme: ${id}` });
    }
    return adminThemeResponseSchema.parse(staged);
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

  // ADR 0008: the flag is stored as sent — the Theme's Ready floor is the dashboard's rule, not ours.
  async stageQuestion(
    id: string,
    { readyToBePublished }: AdminQuestionStaging,
  ): Promise<AdminQuestionResponse> {
    const staged = await this.curationRepository.updateQuestion({ id, readyToBePublished });
    if (staged === null) {
      throw new NotFoundException({ message: `Unknown question: ${id}` });
    }
    return adminQuestionResponseSchema.parse(staged);
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

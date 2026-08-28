import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type DeepPartial, Repository } from "typeorm";
import { CategoryEntity } from "../../_database/entities/category.entity";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";

// An aggregate composes its entity rather than restating it: only the computed columns are named.
export interface CuratedTheme {
  entity: ThemeEntity;
  questionCount: number;
  readyQuestionCount: number;
}

@Injectable()
export class CurationRepository {
  constructor(
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(ThemeEntity) private readonly themes: Repository<ThemeEntity>,
    @InjectRepository(QuestionEntity) private readonly questions: Repository<QuestionEntity>,
  ) {}

  listCategories(): Promise<CategoryEntity[]> {
    return this.categories.find({ order: { createdAt: "DESC", id: "DESC" } });
  }

  // Curation reads the Catalog whole, staged or not — both counts feed the dashboard's modals.
  async listThemes(): Promise<CuratedTheme[]> {
    const { entities, raw } = await this.themes
      .createQueryBuilder("theme")
      .leftJoin(QuestionEntity, "question", "question.themeId = theme.id")
      .addSelect("count(question.id)", "questionCount")
      .addSelect(
        "count(question.id) filter (where question.readyToBePublished)",
        "readyQuestionCount",
      )
      // Grouping on the primary key carries every other Theme column with it.
      .groupBy("theme.id")
      .orderBy("theme.createdAt", "DESC")
      .addOrderBy("theme.id", "DESC")
      .getRawAndEntities<{ questionCount: string; readyQuestionCount: string }>();

    return entities.map((entity, index) => ({
      entity,
      questionCount: Number(raw[index].questionCount),
      readyQuestionCount: Number(raw[index].readyQuestionCount),
    }));
  }

  async createCategory(category: DeepPartial<CategoryEntity>): Promise<CategoryEntity> {
    const created = this.categories.create(category);
    // Two names slugify to one key often enough that the collision is the Editor's, not a crash.
    const alreadyExists = await this.categories.existsBy({ slug: created.slug });

    if (alreadyExists) {
      throw new ConflictException({ message: `A Category is already named ${created.name}` });
    }

    return this.categories.save(created);
  }

  async updateCategory(category: DeepPartial<CategoryEntity>): Promise<CategoryEntity | null> {
    const merged = await this.categories.preload(category);
    return merged === undefined ? null : this.categories.save(merged);
  }

  // Postgres RESTRICT is the backstop; asking first is what makes an orphaning delete a 409.
  async deleteCategory(id: string): Promise<boolean> {
    const stillHasThemes = await this.themes.existsBy({ categoryId: id });

    if (stillHasThemes) {
      throw new ConflictException({ message: `Category ${id} still holds Themes` });
    }

    const { affected } = await this.categories.delete({ id });
    return (affected ?? 0) > 0;
  }

  async createTheme(theme: DeepPartial<ThemeEntity>): Promise<ThemeEntity> {
    const created = this.themes.create(theme);
    const alreadyExists = await this.themes.existsBy({ slug: created.slug });

    if (alreadyExists) {
      throw new ConflictException({ message: `A Theme is already named ${created.name}` });
    }

    await this.refuseUnknownCategory(created.categoryId);
    return this.themes.save(created);
  }

  // preload keeps the stored slug, so a rename never collides — only the Category can still move.
  async updateTheme(theme: DeepPartial<ThemeEntity>): Promise<ThemeEntity | null> {
    const merged = await this.themes.preload(theme);
    if (merged === undefined) {
      return null;
    }

    await this.refuseUnknownCategory(merged.categoryId);
    return this.themes.save(merged);
  }

  // Another tab can drop the Category a write names between the column's load and the save.
  private async refuseUnknownCategory(categoryId: string): Promise<void> {
    const stillExists = await this.categories.existsBy({ id: categoryId });

    if (!stillExists) {
      throw new BadRequestException({
        message: "This Theme names a Category that no longer exists",
      });
    }
  }

  // The switch names no Category, so staging skips the integrity read an authoring write owes.
  async stageTheme(theme: DeepPartial<ThemeEntity>): Promise<ThemeEntity | null> {
    const merged = await this.themes.preload(theme);
    return merged === undefined ? null : this.themes.save(merged);
  }

  // The Question relation is CASCADE, so Postgres takes the Theme's Questions with it.
  async deleteTheme(id: string): Promise<boolean> {
    const { affected } = await this.themes.delete({ id });
    return (affected ?? 0) > 0;
  }

  createQuestion(question: DeepPartial<QuestionEntity>): Promise<QuestionEntity> {
    return this.questions.save(this.questions.create(question));
  }

  // preload merges onto the stored row, so an authoring save never touches what it left out.
  async updateQuestion(question: DeepPartial<QuestionEntity>): Promise<QuestionEntity | null> {
    const merged = await this.questions.preload(question);
    return merged === undefined ? null : this.questions.save(merged);
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const { affected } = await this.questions.delete({ id });
    return (affected ?? 0) > 0;
  }

  listQuestions(themeId: string): Promise<QuestionEntity[]> {
    return this.questions.find({ where: { themeId }, order: { createdAt: "DESC", id: "DESC" } });
  }
}

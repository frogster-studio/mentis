import { Injectable } from "@nestjs/common";
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
    return this.categories.find({ order: { createdAt: "DESC" } });
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
      .getRawAndEntities<{ questionCount: string; readyQuestionCount: string }>();

    return entities.map((entity, index) => ({
      entity,
      questionCount: Number(raw[index].questionCount),
      readyQuestionCount: Number(raw[index].readyQuestionCount),
    }));
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
    return this.questions.find({ where: { themeId }, order: { createdAt: "DESC" } });
  }
}

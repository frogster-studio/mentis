import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoryEntity } from "../../_database/entities/category.entity";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";

export type CuratedCategory = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type CuratedTheme = {
  id: string;
  name: string;
  categoryId: string;
  image: string;
  published: boolean;
  questionCount: number;
  readyQuestionCount: number;
};

export type CuratedQuestion = {
  id: string;
  themeId: string;
  text: string;
  answer: string;
  aliases: string[];
  misspellings: string[];
  wrongChoices: string[];
  readyToBePublished: boolean;
};

@Injectable()
export class CurationRepository {
  constructor(
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(ThemeEntity) private readonly themes: Repository<ThemeEntity>,
    @InjectRepository(QuestionEntity) private readonly questions: Repository<QuestionEntity>,
  ) {}

  listCategories(): Promise<CuratedCategory[]> {
    return this.categories.find({
      select: { id: true, name: true, color: true, icon: true },
      order: { createdAt: "DESC" },
    });
  }

  // Curation reads the Catalog whole, staged or not — both counts feed the dashboard's modals.
  async listThemes(): Promise<CuratedTheme[]> {
    const rows = await this.themes
      .createQueryBuilder("theme")
      .leftJoin(QuestionEntity, "question", "question.themeId = theme.id")
      .select("theme.id", "id")
      .addSelect("theme.name", "name")
      .addSelect("theme.categoryId", "categoryId")
      .addSelect("theme.image", "image")
      .addSelect("theme.published", "published")
      .addSelect("count(question.id)", "questionCount")
      .addSelect(
        "count(question.id) filter (where question.readyToBePublished)",
        "readyQuestionCount",
      )
      .groupBy("theme.id")
      .addGroupBy("theme.name")
      .addGroupBy("theme.categoryId")
      .addGroupBy("theme.image")
      .addGroupBy("theme.published")
      .addGroupBy("theme.createdAt")
      .orderBy("theme.createdAt", "DESC")
      .getRawMany<{
        id: string;
        name: string;
        categoryId: string;
        image: string;
        published: boolean;
        questionCount: string;
        readyQuestionCount: string;
      }>();
    return rows.map((row) => ({
      ...row,
      questionCount: Number(row.questionCount),
      readyQuestionCount: Number(row.readyQuestionCount),
    }));
  }

  listQuestions(themeId: string): Promise<CuratedQuestion[]> {
    return this.questions.find({
      where: { themeId },
      select: {
        id: true,
        themeId: true,
        text: true,
        answer: true,
        aliases: true,
        misspellings: true,
        wrongChoices: true,
        readyToBePublished: true,
      },
      order: { createdAt: "DESC" },
    });
  }
}

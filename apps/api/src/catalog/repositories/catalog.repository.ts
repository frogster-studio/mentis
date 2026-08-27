import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, type SelectQueryBuilder } from "typeorm";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import type { ThemeVisuals } from "../types/theme-visuals";
import type { ThemeWithQuestionCount } from "../types/theme-with-question-count";

// The row holds a bucket path where the served shape holds the URL the API composes from it.
export type StoredThemeVisuals = Omit<ThemeVisuals, "imageUrl"> & { image: string };

export type StoredThemeWithQuestionCount = Omit<ThemeWithQuestionCount, "imageUrl"> & {
  image: string;
};

export type DrawnQuestion = {
  id: string;
  themeId: string;
  themeName: string;
  text: string;
  answer: string;
  aliases: string[];
  misspellings: string[];
  wrongChoices: string[];
};

@Injectable()
export class CatalogRepository {
  constructor(
    @InjectRepository(ThemeEntity) private readonly themes: Repository<ThemeEntity>,
    @InjectRepository(QuestionEntity) private readonly questions: Repository<QuestionEntity>,
  ) {}

  async themesWithQuestionCounts(): Promise<StoredThemeWithQuestionCount[]> {
    const rows = await this.themes
      .createQueryBuilder("theme")
      .innerJoin("theme.category", "category")
      .leftJoin(QuestionEntity, "question", "question.themeId = theme.id")
      .select("theme.id", "id")
      .addSelect("theme.name", "name")
      .addSelect("theme.image", "image")
      .addSelect("category.id", "categoryId")
      .addSelect("category.name", "categoryName")
      .addSelect("category.color", "categoryColor")
      .addSelect("category.icon", "categoryIcon")
      .addSelect("count(question.id)", "questionCount")
      .groupBy("theme.id")
      .addGroupBy("theme.name")
      .addGroupBy("theme.image")
      .addGroupBy("category.id")
      .addGroupBy("category.name")
      .addGroupBy("category.color")
      .addGroupBy("category.icon")
      .orderBy("theme.name")
      .getRawMany<{
        id: string;
        name: string;
        image: string;
        categoryId: string;
        categoryName: string;
        categoryColor: string;
        categoryIcon: string;
        questionCount: string;
      }>();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.image,
      questionCount: Number(row.questionCount),
      category: {
        id: row.categoryId,
        name: row.categoryName,
        color: row.categoryColor,
        icon: row.categoryIcon,
      },
    }));
  }

  themeExists(id: string): Promise<boolean> {
    return this.themes.existsBy({ id });
  }

  async themeVisualsById(id: string): Promise<StoredThemeVisuals | null> {
    const theme = await this.themes.findOne({ where: { id }, relations: { category: true } });
    if (theme === null) {
      return null;
    }
    const { image, category } = theme;
    return {
      image,
      category: {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
      },
    };
  }

  drawRandomQuestions(themeId: string | null, count: number): Promise<DrawnQuestion[]> {
    const builder = this.servedQuestionBuilder();
    if (themeId !== null) {
      builder.where("question.themeId = :themeId", { themeId });
    }
    return builder.orderBy("random()").limit(count).getRawMany<DrawnQuestion>();
  }

  questionsByIds(ids: string[]): Promise<DrawnQuestion[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.servedQuestionBuilder()
      .where("question.id in (:...ids)", { ids })
      .getRawMany<DrawnQuestion>();
  }

  // The join is what makes every drawn row carry its own Theme name, whatever the draw spanned.
  private servedQuestionBuilder(): SelectQueryBuilder<QuestionEntity> {
    return this.questions
      .createQueryBuilder("question")
      .innerJoin(ThemeEntity, "theme", "theme.id = question.themeId")
      .select("question.id", "id")
      .addSelect("question.themeId", "themeId")
      .addSelect("theme.name", "themeName")
      .addSelect("question.text", "text")
      .addSelect("question.answer", "answer")
      .addSelect("question.aliases", "aliases")
      .addSelect("question.misspellings", "misspellings")
      .addSelect("question.wrongChoices", "wrongChoices");
  }
}

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, type SelectQueryBuilder } from "typeorm";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";

export type ThemeWithQuestionCount = {
  id: string;
  name: string;
  image: string;
  questionCount: number;
  category: { id: string; name: string; color: string; icon: string };
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

  async themesWithQuestionCounts(): Promise<ThemeWithQuestionCount[]> {
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

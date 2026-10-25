import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type ObjectLiteral, Repository, type SelectQueryBuilder } from "typeorm";
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
  category: ThemeVisuals["category"];
};

type CategoryColumns = {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categorySecondaryColor: string;
  categoryIcon: string;
};

type DrawnQuestionRow = Omit<DrawnQuestion, "category"> & CategoryColumns;

@Injectable()
export class CatalogRepository {
  constructor(
    @InjectRepository(ThemeEntity) private readonly themes: Repository<ThemeEntity>,
    @InjectRepository(QuestionEntity) private readonly questions: Repository<QuestionEntity>,
  ) {}

  async themesWithQuestionCounts(): Promise<StoredThemeWithQuestionCount[]> {
    const builder = this.themes
      .createQueryBuilder("theme")
      .innerJoin("theme.category", "category")
      .leftJoin(
        QuestionEntity,
        "question",
        "question.themeId = theme.id and question.readyToBePublished = true",
      )
      .select("theme.id", "id")
      .addSelect("theme.name", "name")
      .addSelect("theme.image", "image");
    const rows = await selectCategoryColumns(builder)
      .addSelect("count(question.id)", "questionCount")
      .where("theme.published = true")
      .groupBy("theme.id")
      .addGroupBy("theme.name")
      .addGroupBy("theme.image")
      .addGroupBy("category.id")
      .addGroupBy("category.name")
      .addGroupBy("category.color")
      .addGroupBy("category.secondaryColor")
      .addGroupBy("category.icon")
      .orderBy("theme.name")
      .getRawMany<
        { id: string; name: string; image: string; questionCount: string } & CategoryColumns
      >();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.image,
      questionCount: Number(row.questionCount),
      category: categoryFromColumns(row),
    }));
  }

  publishedThemeExists(id: string): Promise<boolean> {
    return this.themes.existsBy({ id, published: true });
  }

  // An issued Attempt keeps the Theme it was drawn on, published or not.
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
        secondaryColor: category.secondaryColor,
        icon: category.icon,
      },
    };
  }

  async drawRandomQuestions(themeId: string | null, count: number): Promise<DrawnQuestion[]> {
    const servable = this.servedQuestionBuilder()
      .where("theme.published = true")
      .andWhere("question.readyToBePublished = true");
    const drawn: SelectQueryBuilder<ObjectLiteral> =
      themeId === null
        ? this.oneRandomQuestionPerTheme(servable)
        : servable.andWhere("question.themeId = :themeId", { themeId });
    const rows = await drawn.orderBy("random()").limit(count).getRawMany<DrawnQuestionRow>();
    return rows.map(toDrawnQuestion);
  }

  // An Attempt is fixed at issuance, so un-staging its content must never break one in flight.
  async questionsByIds(ids: string[]): Promise<DrawnQuestion[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.servedQuestionBuilder()
      .where("question.id in (:...ids)", { ids })
      .getRawMany<DrawnQuestionRow>();
    return rows.map(toDrawnQuestion);
  }

  // The join is what makes every drawn row carry its own Theme name, whatever the draw spanned.
  private servedQuestionBuilder(): SelectQueryBuilder<QuestionEntity> {
    const builder = this.questions
      .createQueryBuilder("question")
      .innerJoin(ThemeEntity, "theme", "theme.id = question.themeId")
      .innerJoin("theme.category", "category")
      .select("question.id", "id")
      .addSelect("question.themeId", "themeId")
      .addSelect("theme.name", "themeName")
      .addSelect("question.text", "text")
      .addSelect("question.answer", "answer")
      .addSelect("question.aliases", "aliases")
      .addSelect("question.misspellings", "misspellings")
      .addSelect("question.wrongChoices", "wrongChoices");
    return selectCategoryColumns(builder);
  }

  // A theme-less draw spans as many Themes as it can, so no Theme fills the set alone.
  private oneRandomQuestionPerTheme(
    servable: SelectQueryBuilder<QuestionEntity>,
  ): SelectQueryBuilder<ObjectLiteral> {
    const onePerTheme = servable
      .distinctOn(["question.themeId"])
      .orderBy("question.themeId")
      .addOrderBy("random()");
    return this.questions.manager
      .createQueryBuilder()
      .select("drawn.*")
      .from(`(${onePerTheme.getQuery()})`, "drawn")
      .setParameters(onePerTheme.getParameters());
  }
}

const selectCategoryColumns = <Entity extends object>(
  builder: SelectQueryBuilder<Entity>,
): SelectQueryBuilder<Entity> =>
  builder
    .addSelect("category.id", "categoryId")
    .addSelect("category.name", "categoryName")
    .addSelect("category.color", "categoryColor")
    .addSelect("category.secondaryColor", "categorySecondaryColor")
    .addSelect("category.icon", "categoryIcon");

const categoryFromColumns = (row: CategoryColumns): ThemeVisuals["category"] => ({
  id: row.categoryId,
  name: row.categoryName,
  color: row.categoryColor,
  secondaryColor: row.categorySecondaryColor,
  icon: row.categoryIcon,
});

const toDrawnQuestion = ({
  categoryId,
  categoryName,
  categoryColor,
  categorySecondaryColor,
  categoryIcon,
  ...question
}: DrawnQuestionRow): DrawnQuestion => ({
  ...question,
  category: categoryFromColumns({
    categoryId,
    categoryName,
    categoryColor,
    categorySecondaryColor,
    categoryIcon,
  }),
});

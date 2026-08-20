import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CardEntity, type CardNetwork } from "../../_database/entities/card.entity";

export type CardContent = Pick<CardEntity, "type" | "title" | "tags" | "payload" | "images">;

export type CardListFilters = {
  search?: string;
  type?: CardEntity["type"];
  tag?: string;
};

// % and _ are LIKE wildcards; escaping them makes a search for "100%" match those literal characters.
const escapeLikePattern = (term: string): string => term.replace(/[\\%_]/g, (char) => `\\${char}`);

@Injectable()
export class CardsRepository {
  constructor(@InjectRepository(CardEntity) private readonly cards: Repository<CardEntity>) {}

  async list(
    filters: CardListFilters,
    page: number,
    pageSize: number,
  ): Promise<{ items: CardEntity[]; total: number }> {
    let builder = this.cards.createQueryBuilder("card");
    if (filters.search !== undefined) {
      builder = builder.andWhere("card.title ILIKE :search", {
        search: `%${escapeLikePattern(filters.search)}%`,
      });
    }
    if (filters.type !== undefined) {
      builder = builder.andWhere("card.type = :type", { type: filters.type });
    }
    if (filters.tag !== undefined) {
      builder = builder.andWhere(":tag = ANY (card.tags)", { tag: filters.tag });
    }
    const [items, total] = await builder
      .orderBy("card.updatedAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { items, total };
  }

  async findById(id: string): Promise<CardEntity | null> {
    return this.cards.findOneBy({ id });
  }

  async create(content: CardContent): Promise<CardEntity> {
    const { identifiers } = await this.cards.insert(content);
    return this.cards.findOneByOrFail({ id: identifiers[0].id as string });
  }

  async replace(id: string, content: CardContent): Promise<CardEntity | null> {
    const { affected } = await this.cards.update({ id }, content);
    if (affected === 0) {
      return null;
    }
    return this.cards.findOneBy({ id });
  }

  // The set_updated_at trigger ignores a posted_on-only write, so marking never reorders the library.
  async setPosted(id: string, postedOn: CardNetwork[]): Promise<CardEntity | null> {
    const { affected } = await this.cards.update({ id }, { postedOn });
    if (affected === 0) {
      return null;
    }
    return this.cards.findOneBy({ id });
  }

  async imagePaths(id: string): Promise<string[] | null> {
    const card = await this.cards.findOne({ where: { id }, select: { images: true } });
    if (card === null) {
      return null;
    }
    return card.images.map((image) => image.path);
  }

  async remove(id: string): Promise<{ imagePaths: string[] } | null> {
    const result = await this.cards
      .createQueryBuilder()
      .delete()
      .where("id = :id", { id })
      .returning("images")
      .execute();
    if (result.affected === 0) {
      return null;
    }
    const rows = result.raw as { images: { path: string }[] | null }[];
    return { imagePaths: rows.flatMap((row) => (row.images ?? []).map((image) => image.path)) };
  }
}

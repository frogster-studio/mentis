import {
  type AdminCardListQuery,
  type AdminCardListResponse,
  adminCardListResponseSchema,
} from "@mentis/contracts/admin";
import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../supabase";

const PAGE_SIZE = 20;

// One aliased select string per endpoint: the DB speaks snake_case, the wire
// camelCase (#6). Responses are parsed through the contract before leaving.
const CARD_SELECT =
  "id, type, title, tags, postedOn:posted_on, payload, images, createdAt:created_at, updatedAt:updated_at";

@Injectable()
export class CardsService {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  async list(query: AdminCardListQuery): Promise<AdminCardListResponse> {
    let builder = this.supabase.from("cards").select(CARD_SELECT, { count: "exact" });
    if (query.type) builder = builder.eq("type", query.type);
    if (query.tag) builder = builder.contains("tags", [query.tag]);
    // Skeleton-rough search: title ilike only; real search semantics are impl-issue work.
    if (query.search) builder = builder.ilike("title", `%${query.search}%`);

    const { data, count, error } = await builder
      .order("updated_at", { ascending: false })
      .range((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE - 1);
    if (error) {
      throw new InternalServerErrorException({ code: "INTERNAL", message: error.message });
    }

    return adminCardListResponseSchema.parse({
      items: data ?? [],
      total: count ?? 0,
      page: query.page,
      pageSize: PAGE_SIZE,
    });
  }
}

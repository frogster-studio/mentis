import type { AdminCategoryListResponse } from "@mentis/contracts/admin";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { EditorGuard } from "../../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { CurationService } from "../services/curation.service";

@Controller("admin/categories")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminCategoriesController {
  constructor(private readonly curationService: CurationService) {}

  @Get()
  list(): Promise<AdminCategoryListResponse> {
    return this.curationService.listCategories();
  }
}

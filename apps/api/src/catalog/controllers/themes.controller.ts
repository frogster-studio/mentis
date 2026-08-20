import type { AppThemeListResponse } from "@mentis/contracts/app";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { PublicThrottlerGuard } from "../../common/rate-limit.guard";
import { CatalogService } from "../services/catalog.service";

@Controller("app/themes")
@UseGuards(PublicThrottlerGuard)
export class ThemesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  list(): Promise<AppThemeListResponse> {
    return this.catalogService.listThemes();
  }
}

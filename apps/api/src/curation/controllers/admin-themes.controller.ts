import type { AdminThemeListResponse } from "@mentis/contracts/admin";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { EditorGuard } from "../../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { CurationService } from "../services/curation.service";

@Controller("admin/themes")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminThemesController {
  constructor(private readonly curationService: CurationService) {}

  @Get()
  list(): Promise<AdminThemeListResponse> {
    return this.curationService.listThemes();
  }
}

import {
  type AdminThemeListResponse,
  type AdminThemeResponse,
  type AdminThemeStaging,
  type AdminThemeWrite,
  adminThemeIdSchema,
  adminThemeStagingSchema,
  adminThemeWriteSchema,
} from "@mentis/contracts/admin";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { EditorGuard } from "../../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurationService } from "../services/curation.service";

@Controller("admin/themes")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminThemesController {
  constructor(private readonly curationService: CurationService) {}

  @Get()
  list(): Promise<AdminThemeListResponse> {
    return this.curationService.listThemes();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(adminThemeWriteSchema)) theme: AdminThemeWrite,
  ): Promise<AdminThemeResponse> {
    return this.curationService.createTheme(theme);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(adminThemeIdSchema)) id: string,
    @Body(new ZodValidationPipe(adminThemeWriteSchema)) theme: AdminThemeWrite,
  ): Promise<AdminThemeResponse> {
    return this.curationService.updateTheme(id, theme);
  }

  @Patch(":id/staging")
  stage(
    @Param("id", new ZodValidationPipe(adminThemeIdSchema)) id: string,
    @Body(new ZodValidationPipe(adminThemeStagingSchema)) staging: AdminThemeStaging,
  ): Promise<AdminThemeResponse> {
    return this.curationService.stageTheme(id, staging);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ZodValidationPipe(adminThemeIdSchema)) id: string): Promise<void> {
    return this.curationService.deleteTheme(id);
  }
}

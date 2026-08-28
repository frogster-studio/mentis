import {
  type AdminCategoryListResponse,
  type AdminCategoryResponse,
  type AdminCategoryWrite,
  adminCategoryIdSchema,
  adminCategoryWriteSchema,
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

@Controller("admin/categories")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminCategoriesController {
  constructor(private readonly curationService: CurationService) {}

  @Get()
  list(): Promise<AdminCategoryListResponse> {
    return this.curationService.listCategories();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(adminCategoryWriteSchema)) category: AdminCategoryWrite,
  ): Promise<AdminCategoryResponse> {
    return this.curationService.createCategory(category);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(adminCategoryIdSchema)) id: string,
    @Body(new ZodValidationPipe(adminCategoryWriteSchema)) category: AdminCategoryWrite,
  ): Promise<AdminCategoryResponse> {
    return this.curationService.updateCategory(id, category);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ZodValidationPipe(adminCategoryIdSchema)) id: string): Promise<void> {
    return this.curationService.deleteCategory(id);
  }
}

import {
  type AdminAnecdoteResponse,
  type AdminAnecdoteWrite,
  adminAnecdoteIdSchema,
  adminAnecdoteWriteSchema,
} from "@mentis/contracts/admin";
import { Body, Controller, Param, Post, Put, UseGuards } from "@nestjs/common";
import { EditorGuard } from "../../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AnecdoteImageService } from "../services/anecdote-image.service";
import { CurationService } from "../services/curation.service";

@Controller("admin/anecdotes")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminAnecdotesController {
  constructor(
    private readonly curationService: CurationService,
    private readonly anecdoteImageService: AnecdoteImageService,
  ) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(adminAnecdoteWriteSchema)) anecdote: AdminAnecdoteWrite,
  ): Promise<AdminAnecdoteResponse> {
    return this.curationService.createAnecdote(anecdote);
  }

  // The body is the raw file, read by the parser bootstrap.ts scopes to this route alone.
  @Put(":id/image")
  replaceImage(
    @Param("id", new ZodValidationPipe(adminAnecdoteIdSchema)) id: string,
    @Body() file: unknown,
  ): Promise<AdminAnecdoteResponse> {
    return this.anecdoteImageService.replaceAnecdoteImage(id, file);
  }
}

import {
  type AdminAnecdoteResponse,
  type AdminAnecdoteWrite,
  adminAnecdoteWriteSchema,
} from "@mentis/contracts/admin";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { EditorGuard } from "../../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurationService } from "../services/curation.service";

@Controller("admin/anecdotes")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminAnecdotesController {
  constructor(private readonly curationService: CurationService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(adminAnecdoteWriteSchema)) anecdote: AdminAnecdoteWrite,
  ): Promise<AdminAnecdoteResponse> {
    return this.curationService.createAnecdote(anecdote);
  }
}

import { type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { type AuthedRequest, SupabaseUserGuard } from "./supabase-user.guard";

// #7: the /admin/* guard is the /app verification core plus the editor gate —
// a valid player JWT without the claim is authenticated, not authorized.
@Injectable()
export class EditorGuard extends SupabaseUserGuard {
  override canActivate(context: ExecutionContext): boolean {
    super.canActivate(context);
    const { user } = context.switchToHttp().getRequest<AuthedRequest>();
    const appMetadata = user.claims.app_metadata;
    const role =
      typeof appMetadata === "object" && appMetadata !== null
        ? (appMetadata as Record<string, unknown>).role
        : undefined;
    if (role !== "editor") {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Editor role required" });
    }
    return true;
  }
}

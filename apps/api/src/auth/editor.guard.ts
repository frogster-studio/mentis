import { type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { type AuthedRequest, SupabaseUserGuard } from "./supabase-user.guard";

@Injectable()
export class EditorGuard extends SupabaseUserGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const { user } = context.switchToHttp().getRequest<AuthedRequest>();
    // A player token is authenticated but not authorized, and only app_metadata is server-controlled.
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

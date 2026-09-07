import { type AppProfileResponse, appProfileResponseSchema } from "@mentis/contracts/app";
import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { JWTPayload } from "jose";
import { z } from "zod";
import type { PlayerProfileEntity } from "../../_database/entities/player-profile.entity";
import { ProfileRepository } from "../repositories/profile.repository";
import type { DigitDraw } from "../types/digit-draw";
import { DIGIT_DRAW } from "../utils/digit-draw";
import { defaultPseudo, pseudoKey } from "../utils/pseudo";

const MAX_DEFAULT_PSEUDO_DRAWS = 10;

const fullNameClaimSchema = z.object({ user_metadata: z.object({ full_name: z.string() }) });

const fullNameClaim = (claims: JWTPayload): string | undefined => {
  const parsed = fullNameClaimSchema.safeParse(claims);
  return parsed.success ? parsed.data.user_metadata.full_name : undefined;
};

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    @Inject(DIGIT_DRAW) private readonly drawDigits: DigitDraw,
  ) {}

  // The Leaderboard needs a pseudo for every Account, so the default is created here, lazily.
  async ensureProfile(owner: string, claims: JWTPayload): Promise<AppProfileResponse> {
    const profile =
      (await this.profileRepository.findByOwner(owner)) ??
      (await this.createDefault(owner, claims));
    return appProfileResponseSchema.parse(profile);
  }

  async setPseudo(owner: string, pseudo: string): Promise<AppProfileResponse> {
    const key = pseudoKey(pseudo);
    const holder = await this.profileRepository.findByPseudoKey(key);
    if (holder !== null && holder.owner !== owner) {
      throw new ConflictException({
        code: "PSEUDO_TAKEN",
        message: "This pseudo is already taken",
      });
    }
    // A Player can name themselves before anything created their default, hence the insert.
    await this.profileRepository.insertIfAbsent({ owner, pseudo, pseudoKey: key });
    await this.profileRepository.updateByOwner(owner, { pseudo, pseudoKey: key });
    return appProfileResponseSchema.parse({ pseudo });
  }

  // A drawn default can land on a pseudo already held, so the insert is retried with new digits.
  private async createDefault(owner: string, claims: JWTPayload): Promise<PlayerProfileEntity> {
    const fullName = fullNameClaim(claims);
    for (let draw = 0; draw < MAX_DEFAULT_PSEUDO_DRAWS; draw += 1) {
      const pseudo = defaultPseudo(fullName, this.drawDigits);
      await this.profileRepository.insertIfAbsent({ owner, pseudo, pseudoKey: pseudoKey(pseudo) });
      const created = await this.profileRepository.findByOwner(owner);
      if (created !== null) {
        return created;
      }
    }
    throw new Error(`no free default pseudo after ${MAX_DEFAULT_PSEUDO_DRAWS} draws`);
  }
}

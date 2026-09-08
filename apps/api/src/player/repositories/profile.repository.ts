import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type DeepPartial, Repository } from "typeorm";
import { PlayerProfileEntity } from "../../_database/entities/player-profile.entity";

@Injectable()
export class ProfileRepository {
  constructor(
    @InjectRepository(PlayerProfileEntity)
    private readonly profiles: Repository<PlayerProfileEntity>,
  ) {}

  findByOwner(owner: string): Promise<PlayerProfileEntity | null> {
    return this.profiles.findOne({ where: { owner } });
  }

  findByPseudoKey(pseudoKey: string): Promise<PlayerProfileEntity | null> {
    return this.profiles.findOne({ where: { pseudoKey } });
  }

  // Both uniques are left to decide: a second profile for the owner and a taken key are no-ops.
  async insertIfAbsent(profile: DeepPartial<PlayerProfileEntity>): Promise<void> {
    await this.profiles.createQueryBuilder().insert().values(profile).orIgnore().execute();
  }

  async updateByOwner(owner: string, profile: DeepPartial<PlayerProfileEntity>): Promise<void> {
    await this.profiles.update({ owner }, profile);
  }
}

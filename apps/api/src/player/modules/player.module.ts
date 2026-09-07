import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { PlayerProfileEntity } from "../../_database/entities/player-profile.entity";
import { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";
import { MeController } from "../controllers/me.controller";
import { PlayerRepository } from "../repositories/player.repository";
import { ProfileRepository } from "../repositories/profile.repository";
import { PlayerService } from "../services/player.service";
import { ProfileService } from "../services/profile.service";
import { DIGIT_DRAW, randomDigitDraw } from "../utils/digit-draw";

// The signed-in Player's /app/me surface — owner is the verified JWT sub on every route.
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([QuizSessionEntity, StatBaselineEntity, PlayerProfileEntity]),
  ],
  controllers: [MeController],
  providers: [
    PlayerRepository,
    PlayerService,
    ProfileRepository,
    ProfileService,
    { provide: DIGIT_DRAW, useValue: randomDigitDraw },
  ],
  exports: [ProfileService],
})
export class PlayerModule {}

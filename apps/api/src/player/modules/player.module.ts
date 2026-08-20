import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";
import { MeController } from "../controllers/me.controller";
import { PlayerRepository } from "../repositories/player.repository";
import { PlayerService } from "../services/player.service";

// The signed-in Player's /app/me surface — owner is the verified JWT sub on every route.
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([QuizSessionEntity, StatBaselineEntity])],
  controllers: [MeController],
  providers: [PlayerRepository, PlayerService],
})
export class PlayerModule {}

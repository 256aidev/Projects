import { Module } from '@nestjs/common';
import { RotationModule } from '../rotation/rotation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AssignmentGeneratorService } from './assignment-generator.service';

@Module({
  imports: [RotationModule, NotificationsModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, AssignmentGeneratorService],
  exports: [AssignmentsService, AssignmentGeneratorService],
})
export class AssignmentsModule {}

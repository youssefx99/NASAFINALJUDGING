import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PanelsService } from '../panels/panels.service';
import { UsersService } from '../users/users.service';

async function syncPanelAssignments() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const panelsService = app.get(PanelsService);
  const usersService = app.get(UsersService);

  console.log('Starting panel assignment synchronization...');

  try {
    // Get all panels
    const panels = await panelsService.getAllPanels();
    console.log(`Found ${panels.length} panels`);

    // Clear all existing panel assignments from judges
    const judges = await usersService.getJudges();
    for (const judge of judges) {
      await usersService.updateUser((judge as any)._id.toString(), {
        name: judge.name,
        email: judge.email,
        role: judge.role,
        panelAssignments: [],
      });
    }
    console.log('Cleared existing panel assignments');

    // Re-sync all panel assignments
    for (const panel of panels) {
      if (panel.judges && panel.judges.length > 0) {
        console.log(
          `Syncing panel "${panel.name}" with ${panel.judges.length} judges`,
        );

        for (const judgeId of panel.judges) {
          const judge = await usersService.findById(judgeId.toString());
          if (judge) {
            const currentAssignments = judge.panelAssignments || [];
            const newAssignment = {
              stage: panel.stage as any,
              panel: (panel as any)._id,
            };

            // Check if assignment already exists
            const exists = currentAssignments.some(
              (assignment) =>
                assignment.stage === (panel.stage as any) &&
                assignment.panel.toString() === (panel as any)._id.toString(),
            );

            if (!exists) {
              currentAssignments.push(newAssignment);
              await usersService.updateUser(judgeId.toString(), {
                name: judge.name,
                email: judge.email,
                role: judge.role,
                panelAssignments: currentAssignments,
              });
              console.log(`  - Added assignment for judge ${judge.name}`);
            }
          }
        }
      }
    }

    console.log('Panel assignment synchronization completed successfully!');
  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    await app.close();
  }
}

// Run the synchronization
syncPanelAssignments();

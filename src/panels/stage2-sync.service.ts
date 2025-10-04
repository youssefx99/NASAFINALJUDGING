import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ScoresService } from '../scores/scores.service';
import { PanelsService } from '../panels/panels.service';

@Injectable()
export class Stage2SyncService implements OnModuleInit, OnModuleDestroy {
  private syncInterval: NodeJS.Timeout;
  private previousTop60: string[] = [];

  constructor(
    private readonly scoresService: ScoresService,
    private readonly panelsService: PanelsService,
  ) {}

  onModuleInit() {
    // Start syncing every 30 seconds
    this.startSync();
    console.log('Stage 2 automatic sync started (every 30 seconds)');
  }

  onModuleDestroy() {
    // Clean up interval on shutdown
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  private startSync() {
    this.syncInterval = setInterval(async () => {
      await this.syncTop60Teams();
    }, 30000); // 30 seconds
  }

  async syncTop60Teams() {
    try {
      // Get current top 60 teams from Stage 1
      const top60Teams = await this.scoresService.getTop60TeamsFromStage1();
      const currentTop60Ids = top60Teams.map((t) => t._id.toString()).sort();

      // Check if top 60 has changed
      if (this.arraysEqual(currentTop60Ids, this.previousTop60)) {
        console.log('Top 60 teams unchanged, skipping sync');
        return;
      }

      console.log('Top 60 teams changed, updating Stage 2 panels...');

      // Get all Stage 2 panels
      const stage2Panels = await this.panelsService.getPanelsByStage(2);

      if (stage2Panels.length === 0) {
        console.log('No Stage 2 panels found');
        return;
      }

      // Update each panel with new top 60
      for (const panel of stage2Panels) {
        await this.panelsService.updatePanel((panel as any)._id.toString(), {
          name: panel.name,
          stage: 2,
          awardType: panel.awardType,
          judges: panel.judges,
          teams: currentTop60Ids,
        });
      }

      // Update previous top 60
      this.previousTop60 = currentTop60Ids;

      console.log(
        `Successfully updated ${stage2Panels.length} Stage 2 panels with new top 60 teams`,
      );
    } catch (error) {
      console.error('Error during Stage 2 sync:', error);
    }
  }

  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }
}

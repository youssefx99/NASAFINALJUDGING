import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Score, ScoreDocument } from '../schemas/score.schema';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface UploadProgress {
  uploadId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
  currentBatch?: number;
  totalBatches?: number;
}

@Injectable()
export class TeamsService {
  private uploadProgressMap = new Map<
    string,
    BehaviorSubject<UploadProgress>
  >();
  private readonly BATCH_SIZE = 50; // Process 50 teams at a time
  private readonly BATCH_DELAY = 100; // 100ms delay between batches

  constructor(
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
  ) {}

  async startStreamingCsvUpload(buffer: Buffer): Promise<string> {
    const uploadId = uuidv4();
    const progressSubject = new BehaviorSubject<UploadProgress>({
      uploadId,
      status: 'processing',
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [],
      startTime: new Date(),
      currentBatch: 0,
      totalBatches: 0,
    });

    this.uploadProgressMap.set(uploadId, progressSubject);

    // Start processing asynchronously
    this.processStreamingCsv(buffer, progressSubject).catch((error) => {
      const currentProgress = progressSubject.value;
      progressSubject.next({
        ...currentProgress,
        status: 'failed',
        errors: [...currentProgress.errors, error.message],
        endTime: new Date(),
      });
    });

    return uploadId;
  }

  private async processStreamingCsv(
    buffer: Buffer,
    progressSubject: BehaviorSubject<UploadProgress>,
  ): Promise<void> {
    const csvContent = buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error(
        'CSV file must contain at least a header and one data row',
      );
    }

    // Parse and validate header
    const header = lines[0]
      .split(',')
      .map((col) => col.trim().replace(/"/g, ''));
    const expectedColumns = [
      'team_name',
      'challenge',
      'demo_link',
      'proposal_link',
      'subjects',
      'project_link',
      'nasa_submit_link',
      'panel_number',
    ];

    // Check for required columns only
    const requiredColumns = ['team_name', 'challenge'];
    const missingRequired = requiredColumns.filter(
      (col) => !header.includes(col),
    );
    if (missingRequired.length > 0) {
      throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    const dataRows = lines.slice(1);
    const totalRows = dataRows.length;
    const totalBatches = Math.ceil(totalRows / this.BATCH_SIZE);

    // Update initial progress
    const initialProgress = progressSubject.value;
    progressSubject.next({
      ...initialProgress,
      totalRows,
      totalBatches,
    });

    // Process in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.BATCH_SIZE;
      const endIndex = Math.min(startIndex + this.BATCH_SIZE, totalRows);
      const batchRows = dataRows.slice(startIndex, endIndex);

      await this.processBatch(
        batchRows,
        header,
        batchIndex + 1,
        startIndex,
        progressSubject,
      );

      // Add delay between batches to prevent overwhelming the database
      if (batchIndex < totalBatches - 1) {
        await this.delay(this.BATCH_DELAY);
      }

      // Check if upload was cancelled
      if (progressSubject.value.status === 'cancelled') {
        return;
      }
    }

    // Final verification step - ensure all teams were processed
    const finalProgress = progressSubject.value;
    const expectedTeamCount = totalRows;
    const actualProcessedCount =
      finalProgress.successfulRows + finalProgress.failedRows;

    // Verification logging
    console.log(`Upload ${progressSubject.value.uploadId} completed:`);
    console.log(`- Expected rows: ${expectedTeamCount}`);
    console.log(`- Successfully processed: ${finalProgress.successfulRows}`);
    console.log(`- Failed: ${finalProgress.failedRows}`);
    console.log(`- Total processed: ${actualProcessedCount}`);

    // Add verification message to progress
    const verificationMessage =
      actualProcessedCount === expectedTeamCount
        ? `✅ All ${expectedTeamCount} rows processed successfully`
        : `⚠️ Processed ${actualProcessedCount}/${expectedTeamCount} rows`;

    // Mark as completed with verification
    progressSubject.next({
      ...finalProgress,
      status: 'completed',
      endTime: new Date(),
      errors: [...finalProgress.errors, verificationMessage],
    });

    // Clean up after 5 minutes
    setTimeout(
      () => {
        this.uploadProgressMap.delete(progressSubject.value.uploadId);
        progressSubject.complete();
      },
      5 * 60 * 1000,
    );
  }

  private async processBatch(
    batchRows: string[],
    header: string[],
    batchNumber: number,
    startRowIndex: number,
    progressSubject: BehaviorSubject<UploadProgress>,
  ): Promise<void> {
    const currentProgress = progressSubject.value;
    const batchTeams: any[] = [];
    const batchErrors: string[] = [];
    const rowDetails: { rowIndex: number; teamData: any }[] = [];

    // Parse batch rows with detailed tracking
    for (let i = 0; i < batchRows.length; i++) {
      const rowIndex = startRowIndex + i + 2; // +2 for header and 1-based indexing
      try {
        const row = this.parseCsvRow(batchRows[i]);
        if (row.length !== header.length) {
          batchErrors.push(
            `Row ${rowIndex}: Column count mismatch (expected ${header.length}, got ${row.length})`,
          );
          continue;
        }

        const teamData: any = {};
        header.forEach((col, index) => {
          teamData[col] = row[index] ? row[index].trim() : '';
        });

        const team = {
          name: teamData.team_name?.trim(),
          challenge: teamData.challenge?.trim(),
          leaderName: teamData.team_name?.trim() || 'Unknown Leader',
          leaderEmail: teamData.team_name
            ? `${teamData.team_name
                .toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[^a-z0-9]/g, '')}@example.com`
            : `team${rowIndex}@example.com`,
          demoLink: teamData.demo_link?.trim() || '',
          proposalLink: teamData.proposal_link?.trim() || '',
          projectLink: teamData.project_link?.trim() || '',
          nasaSubmitLink: teamData.nasa_submit_link?.trim() || '',
          panelNumber: teamData.panel_number?.trim() || '',
          subjects: teamData.subjects
            ? teamData.subjects
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
            : [],
          actualSolution: teamData.actualsolution?.trim() || '',
          qualifiedForStage2: false,
        };

        if (!team.name || !team.challenge) {
          batchErrors.push(
            `Row ${rowIndex}: Missing required fields (team_name: "${team.name}", challenge: "${team.challenge}")`,
          );
          continue;
        }

        batchTeams.push(team);
        rowDetails.push({ rowIndex, teamData: team });
      } catch (error: any) {
        batchErrors.push(`Row ${rowIndex}: Parse error - ${error.message}`);
      }
    }

    // Enhanced bulk save with individual fallback and retry mechanism
    let successfulCount = 0;
    const failedTeams: { team: any; rowIndex: number; error: string }[] = [];

    if (batchTeams.length > 0) {
      try {
        // First attempt: Bulk operation
        const bulkOps = batchTeams.map((teamData, index) => ({
          updateOne: {
            filter: { name: teamData.name },
            update: { $set: teamData },
            upsert: true,
          },
        }));

        const result = await this.teamModel.bulkWrite(bulkOps, {
          ordered: false, // Continue processing even if some operations fail
        });

        // Calculate successful operations correctly
        successfulCount = result.upsertedCount + result.modifiedCount;

        // Note: matchedCount means the document was found but not modified (no changes needed)
        // We should count these as successful too since the team data is already correct
        const alreadyCorrectCount = result.matchedCount;
        successfulCount += alreadyCorrectCount;

        console.log(
          `Bulk operation results: upserted=${result.upsertedCount}, modified=${result.modifiedCount}, matched=${result.matchedCount}`,
        );

        // Check if all teams were processed successfully
        if (successfulCount < batchTeams.length) {
          console.warn(
            `Bulk operation processed ${successfulCount}/${batchTeams.length} teams. Checking for failures...`,
          );

          // Identify which teams might have failed by checking the database
          for (let i = 0; i < batchTeams.length; i++) {
            const team = batchTeams[i];
            const detail = rowDetails[i];

            try {
              // Verify the team exists in database
              const existingTeam = await this.teamModel.findOne({
                name: team.name,
              });
              if (!existingTeam) {
                // Team doesn't exist, this is a real failure - try individual save
                console.log(
                  `Team "${team.name}" not found in database, attempting individual save...`,
                );
                const newTeam = new this.teamModel(team);
                await newTeam.save();
                successfulCount++;
                console.log(
                  `Successfully saved team "${team.name}" individually`,
                );
              }
            } catch (individualError: any) {
              console.error(
                `Failed to save team "${team.name}":`,
                individualError.message,
              );
              failedTeams.push({
                team,
                rowIndex: detail.rowIndex,
                error: individualError.message,
              });
            }
          }
        }
      } catch (bulkError: any) {
        console.error(
          'Bulk operation failed, falling back to individual saves:',
          bulkError.message,
        );

        // Reset success count since bulk operation failed
        successfulCount = 0;

        // Fallback: Individual saves for all teams
        for (let i = 0; i < batchTeams.length; i++) {
          const team = batchTeams[i];
          const detail = rowDetails[i];

          try {
            // Try upsert operation
            const result = await this.teamModel.updateOne(
              { name: team.name },
              { $set: team },
              { upsert: true },
            );

            if (
              result.upsertedCount > 0 ||
              result.modifiedCount > 0 ||
              result.matchedCount > 0
            ) {
              successfulCount++;
            } else {
              failedTeams.push({
                team,
                rowIndex: detail.rowIndex,
                error: 'Database operation returned no result',
              });
            }
          } catch (individualError: any) {
            failedTeams.push({
              team,
              rowIndex: detail.rowIndex,
              error: individualError.message,
            });
          }
        }
      }
    }

    // Add detailed errors for failed teams
    failedTeams.forEach((failed) => {
      batchErrors.push(
        `Row ${failed.rowIndex}: Failed to save team "${failed.team.name}" - ${failed.error}`,
      );
    });

    // Calculate failed count correctly
    // Failed = rows that couldn't be parsed + teams that failed to save
    const parseFailedCount = batchRows.length - batchTeams.length; // Rows that failed parsing
    const saveFailedCount = failedTeams.length; // Teams that failed to save
    const validFailedCount = parseFailedCount + saveFailedCount;

    // Ensure our counts add up correctly
    const totalAccountedFor = successfulCount + validFailedCount;
    if (totalAccountedFor !== batchRows.length) {
      console.warn(
        `Batch ${batchNumber} accounting error: ${successfulCount} successful + ${validFailedCount} failed = ${totalAccountedFor}, expected ${batchRows.length}`,
      );
      console.warn(
        `Details: ${parseFailedCount} parse failures, ${saveFailedCount} save failures, ${successfulCount} successful`,
      );
    }

    // Update progress with accurate counts
    progressSubject.next({
      ...currentProgress,
      processedRows: currentProgress.processedRows + batchRows.length,
      successfulRows: currentProgress.successfulRows + successfulCount,
      failedRows: currentProgress.failedRows + validFailedCount,
      errors: [...currentProgress.errors, ...batchErrors],
      currentBatch: batchNumber,
    });

    // Log batch completion details with better accuracy
    console.log(
      `Batch ${batchNumber} completed: ${successfulCount}/${batchRows.length} teams saved successfully (${validFailedCount} failed)`,
    );
    if (batchErrors.length > 0) {
      console.warn(
        `Batch ${batchNumber} errors (${batchErrors.length}):`,
        batchErrors.slice(0, 3),
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getUploadProgress(uploadId: string): Observable<MessageEvent> {
    const progressSubject = this.uploadProgressMap.get(uploadId);
    if (!progressSubject) {
      throw new Error('Upload not found');
    }

    return new Observable<MessageEvent>((observer) => {
      const subscription = progressSubject.subscribe((progress) => {
        observer.next({
          data: JSON.stringify(progress),
          type: 'progress',
        } as MessageEvent);

        if (
          progress.status === 'completed' ||
          progress.status === 'failed' ||
          progress.status === 'cancelled'
        ) {
          observer.complete();
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  async getUploadStatus(uploadId: string): Promise<UploadProgress | null> {
    const progressSubject = this.uploadProgressMap.get(uploadId);
    return progressSubject ? progressSubject.value : null;
  }

  async cancelUpload(uploadId: string): Promise<void> {
    const progressSubject = this.uploadProgressMap.get(uploadId);
    if (progressSubject) {
      const currentProgress = progressSubject.value;
      progressSubject.next({
        ...currentProgress,
        status: 'cancelled',
        endTime: new Date(),
      });
    }
  }

  async verifyUploadResults(uploadId: string): Promise<any> {
    const progressSubject = this.uploadProgressMap.get(uploadId);
    if (!progressSubject) {
      throw new Error('Upload session not found');
    }

    const progress = progressSubject.value;
    const currentTeamCount = await this.teamModel.countDocuments();

    return {
      uploadId,
      expectedRows: progress.totalRows,
      reportedSuccessful: progress.successfulRows,
      reportedFailed: progress.failedRows,
      currentDatabaseCount: currentTeamCount,
      verificationStatus:
        progress.successfulRows === progress.totalRows ? 'perfect' : 'partial',
      completionRate: (
        (progress.successfulRows / progress.totalRows) *
        100
      ).toFixed(2),
      errors: progress.errors,
    };
  }

  async processCsvFile(buffer: Buffer) {
    const csvContent = buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error(
        'CSV file must contain at least a header and one data row',
      );
    }

    // Parse header
    const header = lines[0]
      .split(',')
      .map((col) => col.trim().replace(/"/g, ''));
    const expectedColumns = [
      'team_name',
      'challenge',
      'demo_link',
      'proposal_link',
      'subjects',
      'project_link',
      'nasa_submit_link',
      'panel_number',
    ];

    // Validate header
    // Check for required columns only
    const requiredColumns = ['team_name', 'challenge'];
    const missingRequired = requiredColumns.filter(
      (col) => !header.includes(col),
    );
    if (missingRequired.length > 0) {
      throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    const teams: any[] = [];
    const errors: string[] = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = this.parseCsvRow(lines[i]);
        if (row.length !== header.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const teamData: any = {};
        header.forEach((col, index) => {
          teamData[col] = row[index] || '';
        });

        // Map CSV columns to schema fields
        const team = {
          name: teamData.team_name,
          challenge: teamData.challenge,
          leaderName: teamData.team_name,
          leaderEmail: `${teamData.team_name.toLowerCase().replace(/\s+/g, '')}@example.com`,
          demoLink: teamData.demo_link || '',
          proposalLink: teamData.proposal_link || '',
          projectLink: teamData.project_link || '',
          nasaSubmitLink: teamData.nasa_submit_link || '',
          panelNumber: teamData.panel_number || '',
          subjects: teamData.subjects
            ? teamData.subjects.split(',').map((s) => s.trim())
            : [],
          actualSolution: teamData.actualsolution || '',
          qualifiedForStage2: false,
        };

        // Validate required fields
        if (!team.name || !team.challenge) {
          errors.push(
            `Row ${i + 1}: Missing required fields (team_name or challenge)`,
          );
          continue;
        }

        teams.push(team);
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0 && teams.length === 0) {
      throw new Error(`CSV processing failed: ${errors.join('; ')}`);
    }

    // Save teams to database
    const savedTeams: TeamDocument[] = [];
    for (const teamData of teams) {
      try {
        const existingTeam = await this.teamModel.findOne({
          name: teamData.name,
        });
        if (existingTeam) {
          Object.assign(existingTeam, teamData);
          const updated = await existingTeam.save();
          savedTeams.push(updated);
        } else {
          const newTeam = new this.teamModel(teamData);
          const saved = await newTeam.save();
          savedTeams.push(saved);
        }
      } catch (error: any) {
        errors.push(`Failed to save team ${teamData.name}: ${error.message}`);
      }
    }

    return {
      count: savedTeams.length,
      teams: savedTeams,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  async getTeamsCount(): Promise<number> {
    return await this.teamModel.countDocuments();
  }

  async getAllTeams(): Promise<Team[]> {
    return await this.teamModel.find().exec();
  }

  async getTeamById(id: string): Promise<Team | null> {
    return await this.teamModel.findById(id).exec();
  }

  async deleteTeam(id: string): Promise<void> {
    const team = await this.teamModel.findById(id);
    if (!team) {
      throw new Error('Team not found');
    }

    // Delete all scores associated with this team
    await this.scoreModel.deleteMany({ team: id });

    // Delete the team
    await this.teamModel.findByIdAndDelete(id);
  }

  async deleteAllTeams(): Promise<{ deletedCount: number }> {
    try {
      // Delete all scores first
      await this.scoreModel.deleteMany({});

      // Delete all teams
      const result = await this.teamModel.deleteMany({});

      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      throw new Error(`Failed to delete all teams: ${error.message}`);
    }
  }

  /**
   * Get top teams from a specific stage
   */
  async getTopTeams(stage: number, limit: number) {
    const teams = await this.teamModel.find().exec();
    const teamScores: Array<{ team: TeamDocument; averageScore: number }> = [];

    for (const team of teams) {
      const scores = await this.scoreModel
        .find({
          team: team._id,
          stage: stage,
        })
        .exec();

      if (scores.length > 0) {
        const avgScore =
          scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length;
        teamScores.push({
          team,
          averageScore: avgScore,
        });
      }
    }

    teamScores.sort((a, b) => b.averageScore - a.averageScore);
    return teamScores.slice(0, limit).map((ts) => ts.team);
  }

  /**
   * Get top 60 teams from Stage 1 for Stage 2 qualification
   */
  async getTop60TeamsFromStage1() {
    const topTeams = await this.getTopTeams(1, 60);
    return topTeams;
  }

  /**
   * Get final rankings with 70/30 formula
   */
  async getFinalRankings(limit: number) {
    const allTeams = await this.teamModel.find().exec();
    const finalRankings: Array<{
      _id: any;
      name: string;
      challenge: string;
      stage1Score: number;
      stage2Score: number;
      finalScore: number;
    }> = [];

    for (const team of allTeams) {
      const stage1Scores = await this.scoreModel
        .find({
          team: team._id,
          stage: 1,
        })
        .exec();

      let stage1Avg = 0;
      if (stage1Scores.length > 0) {
        const stage1Total = stage1Scores.reduce(
          (sum, s) => sum + s.totalScore,
          0,
        );
        stage1Avg = stage1Total / stage1Scores.length;
      }

      const stage2Scores = await this.scoreModel
        .find({
          team: team._id,
          stage: 2,
        })
        .exec();

      let stage2Avg = 0;
      if (stage2Scores.length > 0) {
        const stage2Total = stage2Scores.reduce(
          (sum, s) => sum + s.totalScore,
          0,
        );
        stage2Avg = stage2Total / stage2Scores.length;
      }

      if (stage1Avg > 0 && stage2Avg > 0) {
        const stage1Percent = (stage1Avg / 25) * 100;
        const stage2Percent = (stage2Avg / 5) * 100;
        const finalScore = stage1Percent * 0.6 + stage2Percent * 0.4;

        finalRankings.push({
          _id: team._id,
          name: team.name,
          challenge: team.challenge,
          stage1Score: stage1Percent,
          stage2Score: stage2Percent,
          finalScore: finalScore,
        });
      }
    }

    finalRankings.sort((a, b) => b.finalScore - a.finalScore);
    return finalRankings.slice(0, limit);
  }
}

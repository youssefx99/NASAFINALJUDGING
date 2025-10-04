/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to escape CSV values
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Helper function to create CSV content
function createCsvContent(headers: string[], rows: any[][]): string {
  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const escapedRow = row.map((cell) => escapeCsvValue(cell));
    csvRows.push(escapedRow.join(','));
  }

  return csvRows.join('\n');
}

// Function to export judges data to CSV
async function exportJudgesToCsv(
  judges: any[],
  outputDir: string,
): Promise<void> {
  const headers = [
    'Judge Number',
    'Name',
    'Email',
    'Password',
    'ID',
    'Stage 1 Assigned',
    'Stage 2 Assigned',
    'Panel Assignments Count',
    'Panel Names',
    'Award Types',
  ];

  const rows = judges.map((judge, index) => {
    const firstName = judge.name.split(' ')[0];
    const password = `${index + 1}${firstName}`;

    const stage1Assigned = judge.panelAssignments.some(
      (assignment: any) => assignment.stage === 1,
    );
    const stage2Assigned = judge.panelAssignments.some(
      (assignment: any) => assignment.stage === 2,
    );

    const panelNames = judge.panelAssignments
      .map((assignment: any) => assignment.panel?.name || 'Unknown')
      .join('; ');

    const awardTypes = judge.panelAssignments
      .map((assignment: any) => assignment.panel?.awardType || '')
      .filter((type: string) => type)
      .join('; ');

    return [
      index + 1,
      judge.name,
      judge.email,
      password,
      judge._id,
      stage1Assigned ? 'Yes' : 'No',
      stage2Assigned ? 'Yes' : 'No',
      judge.panelAssignments.length,
      panelNames,
      awardTypes,
    ];
  });

  const csvContent = createCsvContent(headers, rows);
  const filePath = path.join(outputDir, 'judges_data.csv');
  fs.writeFileSync(filePath, csvContent, 'utf8');
  console.log(`📄 Judges data exported to: ${filePath}`);
}

// Function to export panel assignments to CSV
async function exportPanelAssignmentsToCsv(
  judges: any[],
  panels: any[],
  outputDir: string,
): Promise<void> {
  const headers = [
    'Judge Name',
    'Judge Email',
    'Panel Name',
    'Stage',
    'Award Type',
    'Panel ID',
    'Teams Count',
    'Judge ID',
  ];

  const rows: any[][] = [];

  for (const judge of judges) {
    if (judge.panelAssignments && judge.panelAssignments.length > 0) {
      for (const assignment of judge.panelAssignments) {
        const panel = assignment.panel;
        if (panel) {
          rows.push([
            judge.name,
            judge.email,
            panel.name,
            assignment.stage,
            panel.awardType || '',
            panel._id,
            panel.teams ? panel.teams.length : 0,
            judge._id,
          ]);
        }
      }
    }
  }

  const csvContent = createCsvContent(headers, rows);
  const filePath = path.join(outputDir, 'panel_assignments.csv');
  fs.writeFileSync(filePath, csvContent, 'utf8');
  console.log(`📄 Panel assignments exported to: ${filePath}`);
}

// Function to export teams assigned to judges to CSV
async function exportTeamsToJudgesToCsv(
  judges: any[],
  teamModel: Model<TeamDocument>,
  outputDir: string,
): Promise<void> {
  const headers = [
    'Judge Name',
    'Judge Email',
    'Stage',
    'Panel Name',
    'Team Name',
    'Team Challenge',
    'Team Leader Name',
    'Team Leader Email',
    'Qualified for Stage 2',
    'Team ID',
    'Judge ID',
  ];

  const rows: any[][] = [];

  for (const judge of judges) {
    if (judge.panelAssignments && judge.panelAssignments.length > 0) {
      for (const assignment of judge.panelAssignments) {
        const panel = assignment.panel;
        if (panel && panel.teams && panel.teams.length > 0) {
          for (const teamId of panel.teams) {
            const team = await teamModel.findById(teamId).exec();
            if (team) {
              rows.push([
                judge.name,
                judge.email,
                assignment.stage,
                panel.name,
                team.name,
                team.challenge,
                team.leaderName,
                team.leaderEmail,
                team.qualifiedForStage2 ? 'Yes' : 'No',
                team._id,
                judge._id,
              ]);
            }
          }
        }
      }
    }
  }

  const csvContent = createCsvContent(headers, rows);
  const filePath = path.join(outputDir, 'teams_assigned_to_judges.csv');
  fs.writeFileSync(filePath, csvContent, 'utf8');
  console.log(`📄 Teams assigned to judges exported to: ${filePath}`);
}

async function retrieveJudgesData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const panelModel = app.get<Model<PanelDocument>>(getModelToken(Panel.name));
  const teamModel = app.get<Model<TeamDocument>>(getModelToken(Team.name));

  try {
    console.log('🔍 Retrieving judges data...\n');

    // Create output directory for CSV files
    const outputDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${outputDir}\n`);
    } else {
      console.log(`📁 Using existing output directory: ${outputDir}\n`);
    }

    // Get all judges
    const judges = await userModel
      .find({ role: 'judge' })
      .populate('panelAssignments.panel')
      .exec();

    if (judges.length === 0) {
      console.log('❌ No judges found in the database.');
      return;
    }

    console.log(`📊 Found ${judges.length} judges in the database\n`);

    // Display login credentials summary
    console.log('🔑 LOGIN CREDENTIALS SUMMARY');
    console.log('='.repeat(50));
    console.log('Format: Email | Password (counter + first name)\n');

    for (let i = 0; i < Math.min(judges.length, 10); i++) {
      const judge = judges[i];
      const firstName = judge.name.split(' ')[0];
      const password = `${i + 1}${firstName}`;
      console.log(`${i + 1}. ${judge.email} | ${password}`);
    }

    if (judges.length > 10) {
      console.log(
        `... and ${judges.length - 10} more judges (see detailed list below)\n`,
      );
    } else {
      console.log('');
    }

    // Display summary statistics
    console.log('📈 SUMMARY STATISTICS');
    console.log('='.repeat(50));

    const judgesWithStage1 = judges.filter((judge) =>
      judge.panelAssignments.some((assignment) => assignment.stage === 1),
    ).length;

    const judgesWithStage2 = judges.filter((judge) =>
      judge.panelAssignments.some((assignment) => assignment.stage === 2),
    ).length;

    const judgesWithBothStages = judges.filter(
      (judge) =>
        judge.panelAssignments.some((assignment) => assignment.stage === 1) &&
        judge.panelAssignments.some((assignment) => assignment.stage === 2),
    ).length;

    console.log(`Total Judges: ${judges.length}`);
    console.log(`Stage 1 Judges: ${judgesWithStage1}`);
    console.log(`Stage 2 Judges: ${judgesWithStage2}`);
    console.log(`Both Stages: ${judgesWithBothStages}`);
    console.log(
      `Unassigned Judges: ${judges.length - judgesWithStage1 - judgesWithStage2 + judgesWithBothStages}\n`,
    );

    // Display detailed judge information
    console.log('👨‍⚖️ DETAILED JUDGE INFORMATION');
    console.log('='.repeat(50));

    for (let i = 0; i < judges.length; i++) {
      const judge = judges[i];
      // Generate the original password based on our logic: counter + first name
      const firstName = judge.name.split(' ')[0];
      const originalPassword = `${i + 1}${firstName}`;

      console.log(`\n${i + 1}. ${judge.name}`);
      console.log(`   📧 Email: ${judge.email}`);
      console.log(`   🔑 Password: ${originalPassword}`);
      console.log(`   🆔 ID: ${judge._id}`);

      if (judge.panelAssignments && judge.panelAssignments.length > 0) {
        console.log(`   🎯 Panel Assignments:`);

        for (const assignment of judge.panelAssignments) {
          const panel = assignment.panel as any;
          if (panel) {
            console.log(`      • Stage ${assignment.stage}: ${panel.name}`);
            if (panel.awardType) {
              console.log(`        Award Type: ${panel.awardType}`);
            }
            console.log(`        Panel ID: ${panel._id}`);
            console.log(
              `        Teams Count: ${panel.teams ? panel.teams.length : 0}`,
            );
          }
        }
      } else {
        console.log(`   ⚠️  No panel assignments`);
      }
    }

    // Display panel information
    console.log('\n\n🏛️ PANEL INFORMATION');
    console.log('='.repeat(50));

    const panels = await panelModel
      .find()
      .populate('judges')
      .populate('teams')
      .exec();

    for (const panel of panels) {
      console.log(`\n📋 ${panel.name}`);
      console.log(`   Stage: ${panel.stage}`);
      if (panel.awardType) {
        console.log(`   Award Type: ${panel.awardType}`);
      }
      console.log(`   Judges Count: ${panel.judges ? panel.judges.length : 0}`);
      console.log(`   Teams Count: ${panel.teams ? panel.teams.length : 0}`);

      if (panel.judges && panel.judges.length > 0) {
        console.log(`   Assigned Judges:`);
        for (const judgeId of panel.judges) {
          const judge = judges.find(
            (j) => j._id.toString() === judgeId.toString(),
          );
          if (judge) {
            console.log(`      • ${judge.name} (${judge.email})`);
          }
        }
      }
    }

    // Display teams assigned to judges
    console.log('\n\n👥 TEAMS ASSIGNED TO JUDGES');
    console.log('='.repeat(50));

    for (const judge of judges) {
      if (judge.panelAssignments && judge.panelAssignments.length > 0) {
        console.log(`\n👨‍⚖️ ${judge.name}`);

        for (const assignment of judge.panelAssignments) {
          const panel = assignment.panel as any;
          if (panel && panel.teams && panel.teams.length > 0) {
            console.log(`   Stage ${assignment.stage} Teams:`);

            for (const teamId of panel.teams) {
              const team = await teamModel.findById(teamId).exec();
              if (team) {
                console.log(`      • ${team.name} (${team.challenge})`);
                console.log(
                  `        Leader: ${team.leaderName} (${team.leaderEmail})`,
                );
                console.log(
                  `        Qualified for Stage 2: ${team.qualifiedForStage2 ? 'Yes' : 'No'}`,
                );
              }
            }
          }
        }
      }
    }

    // Export data to CSV files
    console.log('\n\n📊 EXPORTING DATA TO CSV FILES');
    console.log('='.repeat(50));

    // Export judges data
    await exportJudgesToCsv(judges, outputDir);

    // Export panel assignments
    await exportPanelAssignmentsToCsv(judges, panels, outputDir);

    // Export teams assigned to judges
    await exportTeamsToJudgesToCsv(judges, teamModel, outputDir);

    console.log(
      '\n✅ Judges data retrieval and CSV export completed successfully!',
    );
    console.log(`📁 All CSV files have been saved to: ${outputDir}`);
  } catch (error) {
    console.error('❌ Error retrieving judges data:', error);
  } finally {
    await app.close();
  }
}

// Run the script
retrieveJudgesData().catch(console.error);

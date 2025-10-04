import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Stage, StageDocument } from '../schemas/stage.schema';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Score, ScoreDocument } from '../schemas/score.schema';

async function createStage2TestData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const panelModel = app.get<Model<PanelDocument>>(getModelToken(Panel.name));
  const teamModel = app.get<Model<TeamDocument>>(getModelToken(Team.name));
  const stageModel = app.get<Model<StageDocument>>(getModelToken(Stage.name));
  const scoreModel = app.get<Model<ScoreDocument>>(getModelToken(Score.name));

  try {
    console.log('Creating Stage 2 test data...');

    // 1. Delete existing Stage 2 and create new one with updated criteria
    await stageModel.deleteOne({ name: 'Stage 2' });
    console.log('✓ Existing Stage 2 deleted');

    const stage2 = new stageModel({
      name: 'Stage 2',
      criteria: [
        {
          name: 'Advanced Scientific Methodology Rigor',
          weight: 0.5,
          questions: [
            '1 = Uses established scientific methods correctly with standard approaches',
            '2 = Applies sophisticated scientific methodology with enhanced analytical rigor',
            '3 = Presents unique solutions to complex problems',
          ],
        },
        {
          name: 'Advanced Technical Innovation',
          weight: 0.5,
          questions: [
            '1 = Demonstrates breakthrough technical innovations',
            '2 = Shows novel application of cutting-edge technologies',
            '3 = Presents unique solutions to complex problems',
          ],
        },
      ],
    });
    await stage2.save();
    console.log('✓ Stage 2 created with updated criteria');

    // 2. Create Stage 2 Panel
    let stage2Panel = await panelModel.findOne({ name: 'Stage 2 Panel A' });
    if (!stage2Panel) {
      stage2Panel = new panelModel({
        name: 'Stage 2 Panel A',
        stage: stage2._id,
        judges: [],
        teams: [],
      });
      await stage2Panel.save();
      console.log('✓ Stage 2 Panel A created');
    } else {
      console.log('✓ Stage 2 Panel A already exists');
    }

    // 3. Create Stage 2 Judge
    const hashedPassword = await bcrypt.hash('password123', 10);
    let stage2Judge = await userModel.findOne({
      email: 'judge.stage2@nasa.com',
    });
    if (!stage2Judge) {
      stage2Judge = new userModel({
        name: 'Dr. Sarah Johnson',
        email: 'judge.stage2@nasa.com',
        passwordHash: hashedPassword,
        role: 'judge',
        panelAssignments: [
          { stage: 2, panel: stage2Panel._id as Types.ObjectId },
        ],
      });
      await stage2Judge.save();
      console.log('✓ Stage 2 Judge created');
    } else {
      console.log('✓ Stage 2 Judge already exists');
    }

    // 4. Add judge to panel
    if (!stage2Panel.judges.includes(stage2Judge._id as Types.ObjectId)) {
      stage2Panel.judges.push(stage2Judge._id as Types.ObjectId);
      await stage2Panel.save();
      console.log('✓ Judge added to Stage 2 Panel');
    }

    // 5. Create Stage 2 Teams
    const stage2Teams = [
      {
        name: 'Quantum Space Solutions',
        challenge: 'Space Technology',
        leaderName: 'Alex Chen',
        leaderEmail: 'alex.chen@quantumspace.com',
        demoLink: 'https://demo.quantumspace.com',
        proposalLink: 'https://proposal.quantumspace.com',
        subjects: ['Quantum Computing', 'Space Technology', 'AI'],
        qualifiedForStage2: true,
      },
      {
        name: 'Mars Habitat Innovators',
        challenge: 'Space Technology',
        leaderName: 'Maria Rodriguez',
        leaderEmail: 'maria.rodriguez@marshabitat.com',
        demoLink: 'https://demo.marshabitat.com',
        proposalLink: 'https://proposal.marshabitat.com',
        subjects: ['Engineering', 'Space Technology', 'Sustainability'],
        qualifiedForStage2: true,
      },
      {
        name: 'Neural Space Networks',
        challenge: 'Space Technology',
        leaderName: 'David Kim',
        leaderEmail: 'david.kim@neuralspace.com',
        demoLink: 'https://demo.neuralspace.com',
        proposalLink: 'https://proposal.neuralspace.com',
        subjects: ['AI', 'Space Technology', 'Machine Learning'],
        qualifiedForStage2: true,
      },
    ];

    const score = await scoreModel.findOne({ stage: 2 });
    console.log('score', score);
    const createdTeams: TeamDocument[] = [];
    for (const teamData of stage2Teams) {
      let team = await teamModel.findOne({ name: teamData.name });
      if (!team) {
        team = new teamModel({
          ...teamData,
          panelStage2: stage2Panel._id as Types.ObjectId,
        });
        await team.save();
        createdTeams.push(team);
        console.log(`✓ Team ${teamData.name} created`);
      } else {
        // Update existing team to be qualified for Stage 2
        team.qualifiedForStage2 = true;
        team.panelStage2 = stage2Panel._id as Types.ObjectId;
        await team.save();
        createdTeams.push(team);
        console.log(`✓ Team ${teamData.name} updated for Stage 2`);
      }
    }

    // 6. Add teams to panel
    const teamIds = createdTeams.map((team) => team._id as Types.ObjectId);
    stage2Panel.teams = teamIds;
    await stage2Panel.save();
    console.log('✓ Teams added to Stage 2 Panel');

    console.log('\n🎉 Stage 2 test data created successfully!');
    console.log('\nTest Judge Credentials:');
    console.log('Email: judge.stage2@nasa.com');
    console.log('Password: password123');
    console.log('\nStage 2 Teams:');
    createdTeams.forEach((team) => {
      console.log(`- ${team.name} (${team.challenge})`);
    });
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await app.close();
  }
}

createStage2TestData().catch(console.error);

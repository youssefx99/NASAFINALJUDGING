import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { StagesService } from '../stages/stages.service';
import { PanelsService } from '../panels/panels.service';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Stage, StageDocument } from '../schemas/stage.schema';
import { Score, ScoreDocument } from '../schemas/score.schema';

const JUDGE_PASSWORD = 'judge123';

const AWARDS = [
  'Best Use of Science',
  'Best Use of Data',
  'Best Use of Technology',
  'Galactic Impact',
  'Best Mission Concept',
  'Most Inspirational',
  'Best Use of Storytelling',
  'Global Connection',
  'Art & Technology',
  'Local Impact',
];

const STAGE2_CRITERIA = [
  ['Advanced Scientific Methodology Rigor (1-5)', 'Original Research Contribution & Innovation (1-5)', 'Scientific Domain Mastery & Expertise (1-5)'],
  ['Data Accessibility & Transformation Excellence (1-5)', 'Unique Data Application Innovation (1-5)', 'Advanced Computational Value Addition (1-5)'],
  ['Technological Innovation & Breakthrough Achievement (1-5)', 'Technical Sophistication & Engineering Excellence (1-5)', 'Problem-Solving Impact & Effectiveness (1-5)'],
  ['Global Scale Impact Potential (1-5)', 'Implementation Feasibility & Execution Strategy (1-5)', 'Long-term Sustainability & Lasting Value (1-5)'],
  ['Mission Architecture & Design Completeness (1-5)', 'Technical & Scientific Plausibility (1-5)', 'Operational Excellence & Mission Lifecycle Management (1-5)'],
  ['Emotional Resonance & Inspirational Impact (1-5)', 'Educational Mission & Social Value (1-5)', 'Hope, Vision & Future Transformation (1-5)'],
  ['Narrative Innovation & Creative Excellence (1-5)', 'Data Integration & Accessibility Mastery (1-5)', 'Audience Engagement & Communication Impact (1-5)'],
  ['International Collaboration & Unity Building (1-5)', 'Cross-Cultural Accessibility & Inclusion (1-5)', 'Global Community Impact & Network Building (1-5)'],
  ['Art-Technology Fusion & Integration Excellence (1-5)', 'Creative Innovation & Aesthetic Excellence (1-5)', 'Technical Artistry & Innovation Synthesis (1-5)'],
  ['Community Need Alignment & Problem Relevance (1-5)', 'Local Accessibility & Community Usability (1-5)', 'Community Adoption & Sustainable Impact (1-5)'],
].map((questions, i) => ({ name: AWARDS[i], weight: 1.0, questions }));

const TEAM_COUNT = 1000;
const JUDGE_COUNT = 50;
const STAGE1_PANEL_COUNT = 40;
const JUDGES_PER_STAGE1_PANEL = 3;
const JUDGES_PER_STAGE2_PANEL = 3;
const QUALIFIED_COUNT = 60;

const TITLES = ['Dr.', 'Prof.', 'Eng.'];
const FIRST_NAMES = [
  'Sarah', 'Omar', 'Emily', 'Karim', 'Laila', 'James', 'Nour', 'Mona', 'Ahmed', 'Rania',
  'Michael', 'Youssef', 'Hana', 'David', 'Salma', 'Tarek', 'Maria', 'Ali', 'Nadia', 'John',
  'Farah', 'Hassan', 'Lina', 'Peter', 'Dina',
];
const LAST_NAMES = ['Johnson', 'Hassan', 'Carter', 'Mostafa', 'Mahmoud', 'Wilson', 'Adel', 'Samir', 'Fathy', 'Brown'];
const JUDGES = Array.from(
  { length: JUDGE_COUNT },
  (_, i) => `${TITLES[i % 3]} ${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]}`,
);

const CHALLENGES = [
  'Exoplanet Explorer', 'Climate Watch from Space', 'Lunar Habitat Design',
  'Space Debris Tracker', 'Earth Observation AI', 'Mars Rover Navigation',
];
const SOLUTIONS = ['web', 'mobile', 'ai'];
const TEAM_ADJECTIVES = ['Orbit', 'Stellar', 'Nebula', 'Cosmic', 'Lunar', 'Red Planet', 'Gravity', 'Astro', 'Solar', 'Galaxy',
  'Quantum', 'Starlight', 'Comet', 'Rocket', 'Deep Space', 'Meteor', 'Exo', 'Mission', 'Space Weather', 'Terra'];
const TEAM_NOUNS = ['Builders', 'Coders', 'Minds', 'Pioneers', 'Labs', 'Crew', 'Hackers', 'Analysts', 'Sailors', 'Gazers'];
const TEAM_NAMES = Array.from(
  { length: TEAM_COUNT },
  (_, i) => `${TEAM_ADJECTIVES[i % 20]} ${TEAM_NOUNS[Math.floor(i / 20) % 10]} ${Math.floor(i / 200) + 1}`,
);

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');

// deterministic pseudo-random so re-seeding gives the same data
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const panelModel = app.get<Model<PanelDocument>>(getModelToken(Panel.name));
  const teamModel = app.get<Model<TeamDocument>>(getModelToken(Team.name));
  const stageModel = app.get<Model<StageDocument>>(getModelToken(Stage.name));
  const scoreModel = app.get<Model<ScoreDocument>>(getModelToken(Score.name));

  console.log('Clearing collections...');
  await Promise.all([
    userModel.deleteMany({}), panelModel.deleteMany({}), teamModel.deleteMany({}),
    stageModel.deleteMany({}), scoreModel.deleteMany({}),
  ]);

  // Admin + default stages + Stage 2 award panels (same bootstrap the app runs)
  await app.get(AuthService).createAdminUser();
  const stagesService = app.get(StagesService);
  await stagesService.createDefaultStages();
  await stagesService.updateStage('Stage 2', { name: 'Stage 2', criteria: STAGE2_CRITERIA });
  await app.get(PanelsService).createStage2Panels();

  // Judges
  const passwordHash = await bcrypt.hash(JUDGE_PASSWORD, 10);
  const judges = await userModel.insertMany(
    JUDGES.map((name, i) => ({
      name,
      email: `${slug(name.replace(/^(Dr|Prof|Eng)\.\s*/, ''))}.${i + 1}@judge.nasa.com`,
      passwordHash,
      role: 'judge',
      panelAssignments: [],
    })),
  );

  // Stage 1 panels: each panel gets 3 judges (judges rotate across panels) and TEAM_COUNT / STAGE1_PANEL_COUNT teams
  const teamsPerPanel = Math.ceil(TEAM_COUNT / STAGE1_PANEL_COUNT);
  const stage1Panels = await panelModel.insertMany(
    Array.from({ length: STAGE1_PANEL_COUNT }, (_, p) => ({
      name: `Panel ${p + 1}`,
      stage: 1,
      judges: Array.from({ length: JUDGES_PER_STAGE1_PANEL }, (_, k) => judges[(p * JUDGES_PER_STAGE1_PANEL + k) % JUDGE_COUNT]._id),
      teams: [],
    })),
  );

  const teams = await teamModel.insertMany(
    TEAM_NAMES.map((name, i) => {
      const p = Math.floor(i / teamsPerPanel);
      const s = slug(name);
      return {
        name,
        challenge: CHALLENGES[i % CHALLENGES.length],
        leaderName: `Leader of ${name}`,
        leaderEmail: `leader@${s.replace(/\./g, '')}.com`,
        demoLink: `https://example.com/${s}/demo`,
        proposalLink: `https://example.com/${s}/proposal`,
        projectLink: `https://github.com/example/${s}`,
        nasaSubmitLink: `https://www.spaceappschallenge.org/projects/${s}`,
        panelNumber: String(p + 1),
        subjects: [CHALLENGES[i % CHALLENGES.length], 'Space Technology'],
        actualSolution: SOLUTIONS[i % 3],
        panelStage1: stage1Panels[p]._id,
        qualifiedForStage2: false,
      };
    }),
  );
  await panelModel.bulkWrite(
    stage1Panels.map((panel, p) => ({
      updateOne: { filter: { _id: panel._id }, update: { teams: teams.slice(p * teamsPerPanel, (p + 1) * teamsPerPanel).map((t) => t._id) } },
    })),
  );

  // Stage 1 scores: the last 4 panels are left partially scored so incomplete judges / teams exist
  const stage1 = await stageModel.findOne({ name: 'Stage 1' }).exec();
  const stage1Scores: any[] = [];
  for (let p = 0; p < STAGE1_PANEL_COUNT; p++) {
    const panelTeams = teams.slice(p * teamsPerPanel, (p + 1) * teamsPerPanel);
    const fullyScored = p < STAGE1_PANEL_COUNT - 4;
    stage1Panels[p].judges.forEach((judgeId, k) => {
      const scoredTeams = fullyScored ? panelTeams : k === 0 ? panelTeams.slice(0, 10) : [];
      for (const team of scoredTeams) {
        const scores: Record<string, number[]> = {};
        const criteriaScores: Record<string, number> = {};
        let total = 0;
        let max = 0;
        for (const c of stage1!.criteria) {
          scores[c.name] = c.questions.map(() => (rand() < 0.65 ? 1 : 0));
          criteriaScores[c.name] = scores[c.name].reduce((a, b) => a + b, 0);
          total += criteriaScores[c.name] * c.weight;
          max += c.questions.length * c.weight;
        }
        stage1Scores.push({ judge: judgeId, team: team._id, stage: 1, scores, criteriaScores, totalScore: max ? (total / max) * 5 : 0 });
      }
    });
  }
  await scoreModel.insertMany(stage1Scores);

  // Stage 2: qualify the top teams into every award panel, 3 judges per award panel (each judge sits on at most one)
  const top = await scoreModel.aggregate([
    { $match: { stage: 1 } },
    { $group: { _id: '$team', averageScore: { $avg: '$totalScore' } } },
    { $sort: { averageScore: -1 } },
    { $limit: QUALIFIED_COUNT },
  ]);
  const qualifiedIds = top.map((t) => t._id);
  const stage2Panels = await panelModel.find({ stage: 2 }).exec();
  await panelModel.bulkWrite(
    stage2Panels.map((panel, i) => ({
      updateOne: {
        filter: { _id: panel._id },
        update: { teams: qualifiedIds, judges: Array.from({ length: JUDGES_PER_STAGE2_PANEL }, (_, k) => judges[i + k * stage2Panels.length]._id) },
      },
    })),
  );

  // Stage 2 scores: all award panels except the last two are fully scored
  const stage2PanelsWithJudges = await panelModel.find({ stage: 2 }).exec();
  const stage2Scores: any[] = [];
  stage2PanelsWithJudges.forEach((panel, i) => {
    const scoredTeams = i < stage2PanelsWithJudges.length - 2 ? qualifiedIds : qualifiedIds.slice(0, 20);
    for (const judgeId of panel.judges) {
      for (const teamId of scoredTeams) {
        const values = [0, 1, 2].map(() => 1 + Math.floor(rand() * 5));
        stage2Scores.push({
          judge: judgeId, team: teamId, stage: 2, awardType: panel.awardType,
          scores: { [panel.awardType]: values },
          criteriaScores: {},
          totalScore: values.reduce((a, b) => a + b, 0) / values.length,
        });
      }
    }
  });
  await scoreModel.insertMany(stage2Scores);
  const scoreCount = stage1Scores.length + stage2Scores.length;

  // panelAssignments on each judge, mirroring panel.judges
  const allPanels = await panelModel.find().lean().exec();
  await userModel.bulkWrite(
    judges.map((j) => ({
      updateOne: {
        filter: { _id: j._id },
        update: {
          panelAssignments: allPanels
            .filter((pn) => pn.judges.some((id) => id.equals(j._id as Types.ObjectId)))
            .map((pn) => ({ stage: pn.stage, panel: pn._id })),
        },
      },
    })),
  );

  console.log('\nSeed complete:');
  console.log(`  Admin:  admin@test.com / 1234`);
  console.log(`  Judges: ${judges.length} (password: ${JUDGE_PASSWORD})`);
  console.log(`    e.g. ${judges[0].email}`);
  console.log(`  Teams: ${teams.length} | Stage 1 panels: ${stage1Panels.length} | Stage 2 panels: ${stage2Panels.length} | Scores: ${scoreCount}`);

  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

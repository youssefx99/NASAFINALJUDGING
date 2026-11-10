import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { StagesService } from './stages/stages.service';
import { PanelsService } from './panels/panels.service';
import * as express from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// Keep in sync with the headers route in vercel.json (static files are served by the CDN there)
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Spreadsheet imports send team rows as JSON
  app.useBodyParser('json', { limit: '4mb' });

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use((req, res, next) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(name, value);
    }
    if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Expose server processing time (visible in DevTools and used by the benchmark)
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    const writeHead = res.writeHead;
    res.writeHead = function (...args: any[]) {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      res.setHeader('Server-Timing', `app;dur=${ms.toFixed(1)}`);
      return writeHead.apply(this, args);
    } as typeof res.writeHead;
    next();
  });

  // Serve static files
  app.use(express.static(join(__dirname, '..', 'public')));

  // SPA fallback - serve index.html for non-API routes
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.match(/\.\w+$/)) {
      res.sendFile(join(__dirname, '..', 'public', 'index.html'));
    } else {
      next();
    }
  });

  try {
    // Create admin user on startup
    const authService = app.get(AuthService);
    await authService.createAdminUser();

    // Create default stages
    const stagesService = app.get(StagesService);
    await stagesService.createDefaultStages();

    // Initialize Stage 2 with award-specific criteria
    await initializeStage2(stagesService);

    // Create Stage 2 panels
    const panelsService = app.get(PanelsService);
    await panelsService.createStage2Panels();
  } catch (error) {
    console.error('Error initializing services:', error);
  }

  return app;
}

async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
}

async function initializeStage2(stagesService: StagesService) {
  try {
    const stage2 = await stagesService.getStageByName('Stage 2');

    // Check if Stage 2 needs to be updated with award criteria
    // Force update if criteria don't match the expected structure
    const needsUpdate =
      !stage2 ||
      stage2.criteria.length !== 10 ||
      stage2.criteria.some((c) => c.weight !== 1.0);

    if (needsUpdate) {
      await stagesService.updateStage('Stage 2', {
        name: 'Stage 2',
        criteria: [
          {
            name: 'Best Use of Science',
            weight: 1.0,
            questions: [
              'Advanced Scientific Methodology Rigor (1-5)',
              'Original Research Contribution & Innovation (1-5)',
              'Scientific Domain Mastery & Expertise (1-5)',
            ],
          },
          {
            name: 'Best Use of Data',
            weight: 1.0,
            questions: [
              'Data Accessibility & Transformation Excellence (1-5)',
              'Unique Data Application Innovation (1-5)',
              'Advanced Computational Value Addition (1-5)',
            ],
          },
          {
            name: 'Best Use of Technology',
            weight: 1.0,
            questions: [
              'Technological Innovation & Breakthrough Achievement (1-5)',
              'Technical Sophistication & Engineering Excellence (1-5)',
              'Problem-Solving Impact & Effectiveness (1-5)',
            ],
          },
          {
            name: 'Galactic Impact',
            weight: 1.0,
            questions: [
              'Global Scale Impact Potential (1-5)',
              'Implementation Feasibility & Execution Strategy (1-5)',
              'Long-term Sustainability & Lasting Value (1-5)',
            ],
          },
          {
            name: 'Best Mission Concept',
            weight: 1.0,
            questions: [
              'Mission Architecture & Design Completeness (1-5)',
              'Technical & Scientific Plausibility (1-5)',
              'Operational Excellence & Mission Lifecycle Management (1-5)',
            ],
          },
          {
            name: 'Most Inspirational',
            weight: 1.0,
            questions: [
              'Emotional Resonance & Inspirational Impact (1-5)',
              'Educational Mission & Social Value (1-5)',
              'Hope, Vision & Future Transformation (1-5)',
            ],
          },
          {
            name: 'Best Use of Storytelling',
            weight: 1.0,
            questions: [
              'Narrative Innovation & Creative Excellence (1-5)',
              'Data Integration & Accessibility Mastery (1-5)',
              'Audience Engagement & Communication Impact (1-5)',
            ],
          },
          {
            name: 'Global Connection',
            weight: 1.0,
            questions: [
              'International Collaboration & Unity Building (1-5)',
              'Cross-Cultural Accessibility & Inclusion (1-5)',
              'Global Community Impact & Network Building (1-5)',
            ],
          },
          {
            name: 'Art & Technology',
            weight: 1.0,
            questions: [
              'Art-Technology Fusion & Integration Excellence (1-5)',
              'Creative Innovation & Aesthetic Excellence (1-5)',
              'Technical Artistry & Innovation Synthesis (1-5)',
            ],
          },
          {
            name: 'Local Impact',
            weight: 1.0,
            questions: [
              'Community Need Alignment & Problem Relevance (1-5)',
              'Local Accessibility & Community Usability (1-5)',
              'Community Adoption & Sustainable Impact (1-5)',
            ],
          },
        ],
      });
      console.log('Stage 2 award criteria initialized');
    }
  } catch (error) {
    console.error('Error initializing Stage 2:', error);
  }
}

if (require.main === module) {
  bootstrap();
}

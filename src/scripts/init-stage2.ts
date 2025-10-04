import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StagesService } from '../stages/stages.service';

async function initializeStage2() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const stagesService = app.get(StagesService);

  console.log('Initializing Stage 2 award-specific criteria...');

  try {
    // Update Stage 2 with all 10 award-specific criteria
    await stagesService.updateStage('Stage 2', {
      name: 'Stage 2',
      criteria: [
        {
          name: 'Best Use of Science',
          weight: 0.33,
          questions: [
            'Advanced Scientific Methodology Rigor (1-5)',
            'Original Research Contribution & Innovation (1-5)',
            'Scientific Domain Mastery & Expertise (1-5)',
          ],
        },
        {
          name: 'Best Use of Data',
          weight: 0.33,
          questions: [
            'Data Accessibility & Transformation Excellence (1-5)',
            'Unique Data Application Innovation (1-5)',
            'Advanced Computational Value Addition (1-5)',
          ],
        },
        {
          name: 'Best Use of Technology',
          weight: 0.33,
          questions: [
            'Technological Innovation & Breakthrough Achievement (1-5)',
            'Technical Sophistication & Engineering Excellence (1-5)',
            'Problem-Solving Impact & Effectiveness (1-5)',
          ],
        },
        {
          name: 'Galactic Impact',
          weight: 0.33,
          questions: [
            'Global Scale Impact Potential (1-5)',
            'Implementation Feasibility & Execution Strategy (1-5)',
            'Long-term Sustainability & Lasting Value (1-5)',
          ],
        },
        {
          name: 'Best Mission Concept',
          weight: 0.33,
          questions: [
            'Mission Architecture & Design Completeness (1-5)',
            'Technical & Scientific Plausibility (1-5)',
            'Operational Excellence & Mission Lifecycle Management (1-5)',
          ],
        },
        {
          name: 'Most Inspirational',
          weight: 0.33,
          questions: [
            'Emotional Resonance & Inspirational Impact (1-5)',
            'Educational Mission & Social Value (1-5)',
            'Hope, Vision & Future Transformation (1-5)',
          ],
        },
        {
          name: 'Best Use of Storytelling',
          weight: 0.33,
          questions: [
            'Narrative Innovation & Creative Excellence (1-5)',
            'Data Integration & Accessibility Mastery (1-5)',
            'Audience Engagement & Communication Impact (1-5)',
          ],
        },
        {
          name: 'Global Connection',
          weight: 0.33,
          questions: [
            'International Collaboration & Unity Building (1-5)',
            'Cross-Cultural Accessibility & Inclusion (1-5)',
            'Global Community Impact & Network Building (1-5)',
          ],
        },
        {
          name: 'Art & Technology',
          weight: 0.33,
          questions: [
            'Art-Technology Fusion & Integration Excellence (1-5)',
            'Creative Innovation & Aesthetic Excellence (1-5)',
            'Technical Artistry & Innovation Synthesis (1-5)',
          ],
        },
        {
          name: 'Local Impact',
          weight: 0.33,
          questions: [
            'Community Need Alignment & Problem Relevance (1-5)',
            'Local Accessibility & Community Usability (1-5)',
            'Community Adoption & Sustainable Impact (1-5)',
          ],
        },
      ],
    });

    console.log('Stage 2 award-specific criteria initialized successfully!');
  } catch (error) {
    console.error('Error during initialization:', error);
  } finally {
    await app.close();
  }
}

// Run the initialization
initializeStage2();

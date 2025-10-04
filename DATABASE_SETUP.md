# Database Setup Guide

## MongoDB Configuration

This project is configured to connect to a MongoDB database called `NasaTeams`.

### Setup Instructions

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **The `.env` file should contain:**
   ```
   MONGODB_URI=mongodb+srv://yousseffaisal20:nrkdouaVFg54zsPk@cluster0.zqmzxsk.mongodb.net/NasaTeams
   PORT=3000
   NODE_ENV=development
   ```

3. **Start the application:**
   ```bash
   npm run start:dev
   ```

## Database Structure

### Configuration Files
- `src/config/database.config.ts` - Database configuration settings
- `src/database/database.module.ts` - MongoDB connection module
- `src/schemas/team.schema.ts` - Example Team schema

### Example Schema
The `Team` schema includes:
- `name` (required) - Team name
- `members` (required) - Array of team member names
- `project` - Project description
- `score` - Team score (default: 0)
- `status` - Team status (default: 'active')
- `timestamps` - Automatic createdAt and updatedAt fields

## Usage Example

To use the Team schema in a service:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team, TeamDocument } from './schemas/team.schema';

@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private teamModel: Model<TeamDocument>) {}

  async create(createTeamDto: any): Promise<Team> {
    const createdTeam = new this.teamModel(createTeamDto);
    return createdTeam.save();
  }

  async findAll(): Promise<Team[]> {
    return this.teamModel.find().exec();
  }
}
```

## Security Note
- The `.env` file is gitignored for security
- Never commit database credentials to version control
- Use environment variables for sensitive configuration

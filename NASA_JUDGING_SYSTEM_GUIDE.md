# 🚀 NASA Teams Judging System - Complete Guide Book

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Installation & Setup](#installation--setup)
4. [User Roles & Authentication](#user-roles--authentication)
5. [Admin Dashboard](#admin-dashboard)
6. [Judge Management](#judge-management)
7. [Team Management](#team-management)
8. [Panel Management](#panel-management)
9. [Stage 1 Judging](#stage-1-judging)
10. [Stage 2 Qualification](#stage-2-qualification)
11. [Stage 2 Judging](#stage-2-judging)
12. [Data Export & Scripts](#data-export--scripts)
13. [Troubleshooting](#troubleshooting)
14. [API Reference](#api-reference)

---

## 🎯 Project Overview

The **NASA Teams Judging System** is a comprehensive web application designed to manage the judging process for NASA Space Apps Challenge teams. The system supports a two-stage judging process with automated qualification and detailed scoring capabilities.

### Key Features

- **🔐 Role-based Authentication** (Admin, Judge)
- **👥 Team Management** with detailed profiles
- **⚖️ Judge Management** with panel assignments
- **📊 Two-Stage Judging Process**
- **🏆 Award Categories** for Stage 2
- **📈 Real-time Statistics** and progress tracking
- **📁 Data Export** capabilities
- **🛠️ Admin Scripts** for data management

### Technology Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Processing**: Multer for CSV uploads

---

## 🏗️ System Architecture

### System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NASA JUDGING SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Vanilla JS + Tailwind CSS)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Admin Panel   │  │  Judge Panel    │  │  Login System   │  │
│  │                 │  │                 │  │                 │  │
│  │ • Dashboard     │  │ • Team Scoring  │  │ • JWT Auth      │  │
│  │ • User Mgmt     │  │ • Progress      │  │ • Role-based    │  │
│  │ • Data Export   │  │ • Stage 1 & 2   │  │ • Session Mgmt  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Backend API (NestJS)                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Auth Module   │  │  Core Modules   │  │  Scripts        │  │
│  │                 │  │                 │  │                 │  │
│  │ • JWT Tokens    │  │ • Judges        │  │ • Data Export   │  │
│  │ • Password Hash │  │ • Teams         │  │ • User Creation │  │
│  │ • Role Check    │  │ • Panels        │  │ • Password Fix  │  │
│  │                 │  │ • Scores        │  │ • Data Clear    │  │
│  │                 │  │ • Stages        │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Database (MongoDB)                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │     Users        │  │     Teams       │  │     Panels       │  │
│  │                 │  │                 │  │                 │  │
│  │ • Admin/Judge   │  │ • Team Info     │  │ • Stage 1/2     │  │
│  │ • Credentials   │  │ • Scores        │  │ • Judges        │  │
│  │ • Assignments   │  │ • Qualification │  │ • Teams         │  │
│  │                 │  │ • Challenge     │  │ • Award Types   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Structure

```
src/
├── auth/                 # Authentication module
├── config/              # Database configuration
├── database/            # MongoDB connection
├── judges/              # Judge management
├── panels/              # Panel management
├── scores/              # Scoring system
├── schemas/             # MongoDB schemas
├── scripts/             # Admin utility scripts
├── stage2-qualification/ # Stage 2 qualification logic
├── stages/              # Stage management
├── teams/               # Team management
└── users/               # User management
```

### Frontend Structure

```
public/
├── js/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-specific JavaScript
│   └── utils/           # Utility functions
├── assets/              # Images and static files
└── index.html           # Main application entry point
```

### Data Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Admin    │    │    Judge    │    │    Team     │
│             │    │             │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ Creates          │ Scores           │ Registers
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Judges    │    │   Scores    │    │    Teams    │
│             │    │             │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│                PANELS                                │
│  ┌─────────────┐              ┌─────────────┐        │
│  │ Stage 1     │              │ Stage 2     │        │
│  │ Panels      │              │ Panels      │        │
│  │             │              │             │        │
│  │ • General   │              │ • Awards    │        │
│  │ • Multiple  │              │ • Specific  │        │
│  │   Judges    │              │   Criteria  │        │
│  └─────────────┘              └─────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Database Schemas

#### User Schema

- **Role**: `admin` | `judge`
- **Authentication**: Email/password with bcrypt
- **Panel Assignments**: Array of panel references with stage numbers

#### Team Schema

- **Basic Info**: Name, challenge, leader details
- **Stage 2 Qualification**: Boolean flag
- **Scores**: Array of judge scores with timestamps

#### Panel Schema

- **Stage**: 1 or 2
- **Award Type**: Specific award categories for Stage 2
- **Assignments**: Judges and teams arrays

---

## 🔄 Judging Workflow

### Complete Judging Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    JUDGING WORKFLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   SETUP     │    │   STAGE 1   │    │   STAGE 2   │         │
│  │   PHASE     │    │   JUDGING   │    │   JUDGING   │         │
│  │             │    │             │    │             │         │
│  │ 1. Create   │    │ 1. Teams    │    │ 1. Qualify  │         │
│  │    Admin    │    │    Assigned │    │    Top N    │         │
│  │ 2. Upload   │    │ 2. Judges   │    │ 2. Assign   │         │
│  │    Teams    │    │    Score    │    │    to Awards │         │
│  │ 3. Create   │    │ 3. Progress │    │ 3. Award    │         │
│  │    Judges   │    │    Tracked  │    │    Scoring  │         │
│  │ 4. Setup    │    │ 4. Complete │    │ 4. Winners  │         │
│  │    Panels   │    │    Scoring  │    │    Selected │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   DATA      │    │   QUALITY   │    │   RESULTS   │         │
│  │   EXPORT    │    │   CONTROL   │    │   EXPORT    │         │
│  │             │    │             │    │             │         │
│  │ • CSV Files │    │ • Validation│    │ • Final     │         │
│  │ • Reports   │    │ • Rollback  │    │   Rankings  │         │
│  │ • Backup    │    │ • Logging   │    │ • Awards    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 1 to Stage 2 Transition

```
┌─────────────────────────────────────────────────────────────────┐
│              STAGE 1 → STAGE 2 TRANSITION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   STAGE 1   │    │ QUALIFICATION│    │   STAGE 2   │         │
│  │   COMPLETE  │    │   PROCESS    │    │   READY     │         │
│  │             │    │             │    │             │         │
│  │ All judges  │───▶│ Calculate   │───▶│ Top teams   │         │
│  │ scored all  │    │ top N teams │    │ assigned to │         │
│  │ teams       │    │             │    │ award panels│         │
│  │             │    │ • Average    │    │             │         │
│  │ • Validation│    │   scores    │    │ • Award     │         │
│  │ • Progress  │    │ • Ranking   │    │   criteria  │         │
│  │   tracking  │    │ • Selection │    │ • Final     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn** package manager

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd NASA-Judging-System
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/NasaTeams
PORT=3000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key
```

### Step 4: Database Setup

The system will automatically create the necessary collections when first started. Ensure your MongoDB instance is running and accessible.

### Step 5: Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

### Step 6: Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

---

## 🔐 User Roles & Authentication

### Admin Role

**Capabilities:**

- Full system access
- User management (create/edit judges)
- Team management
- Panel configuration
- Stage management
- Data export and scripts
- System statistics

**Default Login:**

- Email: `admin@nasa.gov`
- Password: `admin123` (change immediately)

### Judge Role

**Capabilities:**

- View assigned teams
- Score teams in assigned panels
- View scoring history
- Access to Stage 1 and Stage 2 judging interfaces

**Login Credentials:**

- Email: Provided by admin
- Password: Generated using pattern `{counter}{firstName}`

### Authentication Flow

1. **Login Page**: Users enter email and password
2. **JWT Token**: Server validates credentials and issues JWT
3. **Role-based Routing**: Frontend redirects based on user role
4. **Session Management**: Token stored in localStorage

---

## 🎛️ Admin Dashboard

The admin dashboard provides comprehensive system management capabilities.

### Dashboard Overview

**Admin Dashboard Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 NASA Teams Judging System - Admin Dashboard                │
├─────────────────────────────────────────────────────────────────┤
│  Current Stage: Stage 1                    [Switch to Stage 2]   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   📊 Stats      │  │   👥 Teams      │  │   ⚖️ Judges     │  │
│  │                 │  │                 │  │                 │  │
│  │ Total: 150      │  │ Registered: 150 │  │ Active: 25      │  │
│  │ Scored: 120     │  │ Complete: 120   │  │ Assigned: 25   │  │
│  │ Pending: 30     │  │ Pending: 30    │  │ Available: 0   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  🎯 Quick Actions:                                             │
│  [Manage Judges] [Manage Teams] [Panel Config] [Upload Data]    │
│                                                                 │
│  🚀 Stage 2 Qualification:                                     │
│  [Manage Stage 2 Qualification]                                │
└─────────────────────────────────────────────────────────────────┘
```

**Key Sections:**

1. **Current Stage Management**
   - Stage 1: Active judging phase
   - Stage 2: Qualification and judging phase
   - Stage management controls

2. **Quick Statistics**
   - Total teams registered
   - Active judges
   - Panels configured
   - Scoring progress

3. **Management Actions**
   - Judge management
   - Team management
   - Panel configuration
   - Data upload

### Navigation Menu

- **Dashboard**: System overview
- **Judges**: Judge management
- **Teams**: Team management
- **Panels**: Panel configuration
- **Stage 1**: Stage 1 management
- **Stage 2**: Stage 2 management
- **Upload Data**: CSV data import

---

## 👨‍⚖️ Judge Management

### Creating Judges

1. **Navigate to Judges Management**

   ```
   Admin Dashboard → Judges Management
   ```

2. **Add New Judge**
   - Click "Add New Judge" button
   - Fill in judge details:
     - Name
     - Email
     - Password (auto-generated)
   - Assign to panels (Stage 1/Stage 2)

3. **Panel Assignment**
   - Select panels for Stage 1
   - Select panels for Stage 2
   - Save assignments

### Judge Credentials

**Password Pattern**: `{counter}{firstName}`

- Example: Judge "John Smith" → Password: "1John"

### Bulk Judge Operations

**Scripts Available:**

```bash
# Create admin user
npm run script:create-admin

# Retrieve all judge data
npm run script:retrieve-judges

# Fix judge passwords
npm run script:fix-judge-passwords
```

---

## 👥 Team Management

### Team Registration

Teams can be registered through:

1. **CSV Upload** (Bulk import)
2. **Manual Entry** (Individual teams)

### Team Information

**Required Fields:**

- Team Name
- Challenge Category
- Team Leader Name
- Team Leader Email
- Team Members

**Optional Fields:**

- Project Description
- Additional Contact Information

### Team Status Tracking

- **Registered**: Team successfully added
- **Stage 1 Complete**: All judges scored
- **Stage 2 Qualified**: Advanced to Stage 2
- **Stage 2 Complete**: Final judging complete

---

## 🏛️ Panel Management

### Panel Configuration

**Stage 1 Panels:**

- General judging panels
- Multiple judges per panel
- Teams assigned randomly

**Stage 2 Panels:**

- Award-specific panels
- Predefined award categories:
  - Best Use of Science
  - Best Use of Data
  - Best Use of Technology
  - Galactic Impact
  - Best Mission Concept
  - Most Inspirational
  - Best Use of Storytelling
  - Global Connection
  - Art & Technology
  - Local Impact

### Panel Assignment Logic

1. **Stage 1**: Teams distributed across panels
2. **Stage 2**: Top teams assigned to all award panels

---

## 🎯 Stage 1 Judging

### Judge Interface

![Stage 1 Judge Interface](screenshots/stage1-judge-interface.png)

**Features:**

- List of assigned teams
- Scoring interface (1-5 scale)
- Progress tracking
- Save/submit functionality

### Scoring Criteria

**Standard Criteria:**

1. **Innovation** (1-5)
2. **Technical Implementation** (1-5)
3. **Impact** (1-5)
4. **Presentation** (1-5)
5. **Overall Quality** (1-5)

### Team Detail View

![Team Detail](screenshots/team-detail.png)

**Information Displayed:**

- Team name and challenge
- Team members
- Project description
- Scoring form
- Previous scores (if any)

---

## 🚀 Stage 2 Qualification

### Qualification Process

The Stage 2 qualification system automatically determines which teams advance based on Stage 1 scores.

### Qualification Dashboard

![Stage 2 Qualification](screenshots/stage2-qualification.png)

**Key Metrics:**

- **Incomplete Teams**: Teams missing scores from any judge
- **Incomplete Judges**: Judges with pending scoring
- **Ready for Qualification**: Teams with complete scores

### Qualification Steps

1. **Review Statistics**
   - Check incomplete teams count
   - Review incomplete judges
   - Verify ready teams

2. **Set Qualification Limit**
   - Enter number of teams to qualify (1-500)
   - Preview top teams
   - Confirm qualification

3. **Execute Qualification**
   - System calculates top N teams
   - Assigns teams to all Stage 2 panels
   - Updates team qualification status

### Safety Features

- **Input Validation**: Limits between 1-500
- **Preview Feature**: See teams before qualifying
- **Rollback Mechanism**: Automatic rollback on failure
- **Double Confirmation**: Prevents accidental execution
- **Comprehensive Logging**: Full audit trail

---

## 🏆 Stage 2 Judging

### Award-Specific Judging

Each Stage 2 panel focuses on a specific award category with tailored criteria.

### Award Criteria Examples

**Best Use of Science:**

- Scientific accuracy and methodology
- Use of scientific principles
- Innovation in scientific approach
- Potential scientific impact

**Best Use of Data:**

- Data quality and sources
- Data analysis techniques
- Visualization effectiveness
- Data-driven insights

### Judge Workflow

1. **Access Award Panel**
   - Login with judge credentials
   - Navigate to assigned award panel

2. **Review Teams**
   - View qualified teams
   - Access team details
   - Review Stage 1 scores

3. **Score Teams**
   - Use award-specific criteria
   - Provide detailed scores
   - Add comments if needed

4. **Submit Scores**
   - Review all scores
   - Submit final evaluations

---

## 📊 Data Export & Scripts

### CSV Export Features

The system provides comprehensive data export capabilities through the `retrieve-judges-data.ts` script.

#### Generated CSV Files

1. **judges_data.csv**
   - Complete judge information
   - Login credentials
   - Panel assignments
   - Stage assignments

2. **panel_assignments.csv**
   - Judge-panel relationships
   - Stage information
   - Team counts per panel

3. **teams_assigned_to_judges.csv**
   - Team-judge assignments
   - Team details
   - Qualification status

### Running Export Script

```bash
npm run script:retrieve-judges
```

**Output Location**: `exports/` directory in project root

### Available Admin Scripts

```bash
# Create admin user
npm run script:create-admin

# Retrieve judge data (with CSV export)
npm run script:retrieve-judges

# Create Stage 2 test data
npm run script:create-stage2-data

# Clear all data (WARNING: Destructive)
npm run script:clear-data

# Fix judge passwords
npm run script:fix-judge-passwords
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Symptoms:**

- Application fails to start
- Database connection errors

**Solutions:**

- Verify MongoDB URI in `.env` file
- Check MongoDB instance is running
- Verify network connectivity
- Check authentication credentials

#### 2. Authentication Problems

**Symptoms:**

- Login failures
- JWT token errors

**Solutions:**

- Verify JWT_SECRET in `.env`
- Check user credentials
- Clear browser localStorage
- Restart application

#### 3. Judge Password Issues

**Symptoms:**

- Judges cannot login
- Password mismatch

**Solutions:**

```bash
# Reset all judge passwords
npm run script:fix-judge-passwords
```

#### 4. Stage 2 Qualification Issues

**Symptoms:**

- Qualification fails
- Teams not assigned to panels

**Solutions:**

- Check Stage 1 scoring completion
- Verify Stage 2 panels exist
- Review qualification logs
- Use rollback if needed

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=*
```

### Log Files

Check console output for:

- Database operations
- Authentication events
- Qualification process
- Error messages

---

## 📡 API Reference

### Authentication Endpoints

#### POST /api/auth/login

**Request:**

```json
{
  "email": "judge@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "judge@example.com",
    "role": "judge",
    "name": "Judge Name"
  }
}
```

### Judge Endpoints

#### GET /api/judges

**Response:**

```json
[
  {
    "id": "judge-id",
    "name": "Judge Name",
    "email": "judge@example.com",
    "panelAssignments": [...]
  }
]
```

#### POST /api/judges

**Request:**

```json
{
  "name": "New Judge",
  "email": "newjudge@example.com",
  "password": "password123"
}
```

### Team Endpoints

#### GET /api/teams

**Response:**

```json
[
  {
    "id": "team-id",
    "name": "Team Name",
    "challenge": "Challenge Category",
    "leaderName": "Leader Name",
    "leaderEmail": "leader@example.com",
    "qualifiedForStage2": false
  }
]
```

### Scoring Endpoints

#### POST /api/scores

**Request:**

```json
{
  "teamId": "team-id",
  "judgeId": "judge-id",
  "scores": {
    "innovation": 4,
    "technical": 5,
    "impact": 3,
    "presentation": 4,
    "overall": 4
  }
}
```

### Stage 2 Qualification Endpoints

#### GET /api/stage2-qualification/stats

**Response:**

```json
{
  "incompleteTeams": 15,
  "incompleteJudges": 3,
  "readyTeams": 85,
  "totalStage1Teams": 100,
  "topTeamsPreview": [...]
}
```

#### POST /api/stage2-qualification/qualify

**Request:**

```json
{
  "limit": 60
}
```

**Response:**

```json
{
  "success": true,
  "qualifiedTeams": 60,
  "updatedPanels": 10,
  "teamIds": ["team1", "team2", ...]
}
```

---

## 📝 Additional Resources

### Documentation Files

- `DATABASE_SETUP.md` - Database configuration guide
- `IMPLEMENTATION_VERIFICATION.md` - Stage 2 qualification verification
- `STAGE2_QUALIFICATION_SAFETY_CHECKLIST.md` - Safety features checklist

### Support

For technical support or questions:

1. Check this guide first
2. Review console logs
3. Check database connectivity
4. Verify environment configuration

### Best Practices

1. **Regular Backups**: Export data regularly using scripts
2. **Password Security**: Change default admin password
3. **Data Validation**: Verify uploaded data before processing
4. **Stage Management**: Complete Stage 1 before Stage 2 qualification
5. **Testing**: Test qualification process with small datasets first

---

## 🎉 Conclusion

The NASA Teams Judging System provides a comprehensive solution for managing the judging process of NASA Space Apps Challenge teams. With its robust architecture, user-friendly interface, and comprehensive features, it streamlines the entire judging workflow from team registration to final award selection.

The system's two-stage approach ensures fair evaluation while the automated qualification process saves time and reduces human error. The extensive admin tools and data export capabilities provide full control and transparency throughout the process.

For any questions or support needs, refer to this guide and the troubleshooting section, or contact the development team.

---

## 📚 Quick Reference Guide

### Essential Commands

```bash
# Start the application
npm run start:dev

# Create admin user
npm run script:create-admin

# Export judge data to CSV
npm run script:retrieve-judges

# Fix judge passwords
npm run script:fix-judge-passwords

# Clear all data (WARNING: Destructive)
npm run script:clear-data
```

### Default Credentials

**Admin Account:**

- Email: `admin@nasa.gov`
- Password: `admin123` (change immediately)

**Judge Passwords:**

- Pattern: `{counter}{firstName}`
- Example: Judge "John Smith" → Password: "1John"

### Key URLs

- **Application**: `http://localhost:3000`
- **Admin Login**: `http://localhost:3000/login`
- **Judge Login**: `http://localhost:3000/login`

### Database Collections

- **users**: Admin and judge accounts
- **teams**: Team information and scores
- **panels**: Panel configurations and assignments
- **scores**: Individual judge scores

### Award Categories (Stage 2)

1. Best Use of Science
2. Best Use of Data
3. Best Use of Technology
4. Galactic Impact
5. Best Mission Concept
6. Most Inspirational
7. Best Use of Storytelling
8. Global Connection
9. Art & Technology
10. Local Impact

### Scoring Scale

- **Range**: 1-5 points
- **Criteria**: Innovation, Technical Implementation, Impact, Presentation, Overall Quality
- **Stage 1**: General scoring
- **Stage 2**: Award-specific criteria

### File Locations

- **CSV Exports**: `exports/` directory
- **Configuration**: `.env` file
- **Logs**: Console output
- **Database**: MongoDB instance

---

## 🆘 Emergency Procedures

### System Recovery

1. **Database Issues**:

   ```bash
   # Check MongoDB connection
   # Verify .env file
   # Restart application
   ```

2. **Authentication Problems**:

   ```bash
   # Reset admin password
   npm run script:create-admin

   # Fix judge passwords
   npm run script:fix-judge-passwords
   ```

3. **Data Corruption**:

   ```bash
   # Export current data first
   npm run script:retrieve-judges

   # Clear and restart (if needed)
   npm run script:clear-data
   ```

### Contact Information

- **Technical Support**: Development Team
- **Documentation**: This guide
- **Issues**: Check troubleshooting section
- **Backup**: Regular CSV exports recommended

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained By**: NASA Space Apps Development Team

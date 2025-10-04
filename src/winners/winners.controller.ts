import { Controller, Get, Param, Query } from '@nestjs/common';
import { WinnersService } from './winners.service';

@Controller('api/winners')
export class WinnersController {
  constructor(private readonly winnersService: WinnersService) {}

  /**
   * Get winners for all award panels
   * GET /api/winners
   */
  @Get()
  async getWinners() {
    try {
      const winners = await this.winnersService.getAllWinners();
      return {
        success: true,
        data: winners,
        count: winners.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get winners grouped by award panels
   * GET /api/winners/by-award
   */
  @Get('by-award')
  async getWinnersByAward() {
    try {
      const winners = await this.winnersService.getWinnersByAward();
      return {
        success: true,
        data: winners,
        count: winners.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get summary statistics for winners
   * GET /api/winners/summary
   */
  @Get('summary')
  async getWinnersSummary() {
    try {
      const summary = await this.winnersService.getWinnersSummary();
      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Get winner for a specific award type
   * GET /api/winners/award/:awardType
   */
  @Get('award/:awardType')
  async getWinnerByAwardType(@Param('awardType') awardType: string) {
    try {
      const winner = await this.winnersService.getWinnerByAwardType(awardType);

      if (!winner) {
        return {
          success: false,
          error: `No winner found for award type: ${awardType}`,
          data: null,
        };
      }

      return {
        success: true,
        data: winner,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Get detailed score breakdown for a specific winner
   * GET /api/winners/award/:awardType/team/:teamId/breakdown
   */
  @Get('award/:awardType/team/:teamId/breakdown')
  async getWinnerScoreBreakdown(
    @Param('awardType') awardType: string,
    @Param('teamId') teamId: string,
  ) {
    try {
      const breakdown = await this.winnersService.getWinnerScoreBreakdown(
        awardType,
        teamId,
      );

      return {
        success: true,
        data: {
          awardType,
          teamId,
          scoreBreakdown: breakdown,
          totalScores: breakdown.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Get teams ranked by their best score across all award panels
   * GET /api/winners/ranked-teams?limit=10
   */
  @Get('ranked-teams')
  async getTeamsRankedByBestScore(@Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const rankedTeams =
        await this.winnersService.getTeamsRankedByBestScore(limitNum);

      return {
        success: true,
        data: rankedTeams,
        count: rankedTeams.length,
        limit: limitNum,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get all award types with their current status
   * GET /api/winners/award-status
   */
  @Get('award-status')
  async getAwardStatus() {
    try {
      const winners = await this.winnersService.getWinnersByAward();
      const allAwardTypes = [
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

      const awardStatus = allAwardTypes.map((awardType) => {
        const winner = winners.find((w) => w.awardType === awardType);
        return {
          awardType,
          hasWinner: !!winner,
          winnerTeam: winner?.winnerTeam?.name || null,
          winnerScore: winner?.finalScore || null,
          judgeCount: winner?.judgeCount || 0,
        };
      });

      return {
        success: true,
        data: awardStatus,
        totalAwards: allAwardTypes.length,
        awardsWithWinners: winners.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }
}

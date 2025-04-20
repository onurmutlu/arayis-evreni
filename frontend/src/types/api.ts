export interface LeaderboardResponse {
  users: LeaderboardUser[];
  stats?: {
    totalParticipants: number;
    competitionEndDate: string;
    prizePool: string | number;
  };
}

export interface LeaderboardUser {
  id: string;
  username: string;
  avatar?: string;
  xp: number;
  level: number;
  stars: number;
  badges: number;
  rank: number;
  delta?: number;
} 
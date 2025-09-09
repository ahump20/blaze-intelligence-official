
// Team Intelligence API Endpoints
export const TEAM_ENDPOINTS = {
  getAllTeams: '/api/teams',
  getTeamById: '/api/teams/:id',
  getLeagueTeams: '/api/teams/league/:league',
  getTopPerformers: '/api/teams/top/:count',
  getFeaturedTeams: '/api/teams/featured'
};

// Team Intelligence Data
export const TEAM_INTELLIGENCE = [
  {
    "id": "new-york-yankees",
    "name": "New York Yankees",
    "league": "MLB",
    "division": "AL East",
    "founded": 1901,
    "championships": 27,
    "metrics": {
      "competitive_index": 268,
      "legacy_score": 180,
      "blaze_intelligence_score": 214,
      "prediction_accuracy": 94.6,
      "data_points": 31907
    },
    "analytics": {
      "injury_risk": 0.29257194674936937,
      "performance_trend": "rising",
      "playoff_probability": 0.5025114591172282,
      "roster_efficiency": 0.9127032432578279
    },
    "last_updated": "2025-09-09T12:56:45.590Z"
  },
  {
    "id": "notre-dame-fighting-irish",
    "name": "Notre Dame Fighting Irish",
    "league": "NCAA Football",
    "division": "Independent",
    "founded": 1887,
    "championships": 13,
    "metrics": {
      "competitive_index": 195,
      "legacy_score": 130,
      "blaze_intelligence_score": 192,
      "prediction_accuracy": 94.6,
      "data_points": 57146
    },
    "analytics": {
      "injury_risk": 0.2650373966660551,
      "performance_trend": "rising",
      "playoff_probability": 0.8480128415664312,
      "roster_efficiency": 0.7830305883791594
    },
    "last_updated": "2025-09-09T12:56:45.590Z"
  },
  {
    "id": "michigan-wolverines",
    "name": "Michigan Wolverines",
    "league": "NCAA Football",
    "division": "Big Ten",
    "founded": 1879,
    "championships": 12,
    "metrics": {
      "competitive_index": 185,
      "legacy_score": 125,
      "blaze_intelligence_score": 191,
      "prediction_accuracy": 94.6,
      "data_points": 39644
    },
    "analytics": {
      "injury_risk": 0.0329416915046753,
      "performance_trend": "declining",
      "playoff_probability": 0.7763741857100082,
      "roster_efficiency": 0.934276678370028
    },
    "last_updated": "2025-09-09T12:56:45.590Z"
  },
  {
    "id": "alabama-crimson-tide",
    "name": "Alabama Crimson Tide",
    "league": "NCAA Football",
    "division": "SEC",
    "founded": 1892,
    "championships": 18,
    "metrics": {
      "competitive_index": 225,
      "legacy_score": 145,
      "blaze_intelligence_score": 189,
      "prediction_accuracy": 94.6,
      "data_points": 40984
    },
    "analytics": {
      "injury_risk": 0.05906354827760382,
      "performance_trend": "declining",
      "playoff_probability": 0.9588718558582163,
      "roster_efficiency": 0.7049506449460053
    },
    "last_updated": "2025-09-09T12:56:45.590Z"
  },
  {
    "id": "los-angeles-lakers",
    "name": "Los Angeles Lakers",
    "league": "NBA",
    "division": "Pacific",
    "founded": 1947,
    "championships": 17,
    "metrics": {
      "competitive_index": 215,
      "legacy_score": 130,
      "blaze_intelligence_score": 180,
      "prediction_accuracy": 94.6,
      "data_points": 27955
    },
    "analytics": {
      "injury_risk": 0.10243635782418803,
      "performance_trend": "rising",
      "playoff_probability": 0.6253144132230869,
      "roster_efficiency": 0.8590929048453368
    },
    "last_updated": "2025-09-09T12:56:45.590Z"
  }
];

// League Summaries
export const LEAGUE_SUMMARIES = {
  "MLB": {
    "total_teams": 30,
    "total_championships": 119,
    "avg_competitive_index": 105,
    "avg_legacy_score": 59,
    "top_performers": [
      {
        "name": "New York Yankees",
        "score": 237
      },
      {
        "name": "St. Louis Cardinals",
        "score": 164
      },
      {
        "name": "Boston Red Sox",
        "score": 141
      },
      {
        "name": "Oakland Athletics",
        "score": 131
      },
      {
        "name": "Los Angeles Dodgers",
        "score": 127
      }
    ]
  },
  "NFL": {
    "total_teams": 32,
    "total_championships": 100,
    "avg_competitive_index": 100,
    "avg_legacy_score": 50,
    "top_performers": [
      {
        "name": "Green Bay Packers",
        "score": 166
      },
      {
        "name": "New York Giants",
        "score": 145
      },
      {
        "name": "Chicago Bears",
        "score": 134
      },
      {
        "name": "New England Patriots",
        "score": 121
      },
      {
        "name": "Pittsburgh Steelers",
        "score": 118
      }
    ]
  },
  "NBA": {
    "total_teams": 30,
    "total_championships": 81,
    "avg_competitive_index": 97,
    "avg_legacy_score": 49,
    "top_performers": [
      {
        "name": "Boston Celtics",
        "score": 195
      },
      {
        "name": "Los Angeles Lakers",
        "score": 188
      },
      {
        "name": "Golden State Warriors",
        "score": 139
      },
      {
        "name": "Chicago Bulls",
        "score": 127
      },
      {
        "name": "San Antonio Spurs",
        "score": 99
      }
    ]
  },
  "NCAA_FOOTBALL": {
    "total_teams": 10,
    "total_championships": 83,
    "avg_competitive_index": 162,
    "avg_legacy_score": 107,
    "top_performers": [
      {
        "name": "Alabama Crimson Tide",
        "score": 212
      },
      {
        "name": "Michigan Wolverines",
        "score": 188
      },
      {
        "name": "Notre Dame Fighting Irish",
        "score": 168
      },
      {
        "name": "USC Trojans",
        "score": 164
      },
      {
        "name": "Ohio State Buckeyes",
        "score": 161
      }
    ]
  }
};

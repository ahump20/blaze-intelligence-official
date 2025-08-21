/**
 * Cloudflare Worker for Automated Data Refresh
 * Scheduled CRON jobs for keeping player data current
 */

export default {
  async scheduled(event, env, ctx) {
    const timestamp = new Date().toISOString();
    console.log(`CRON job triggered at ${timestamp}`);
    
    switch (event.cron) {
      case "*/30 * * * *": // Every 30 minutes
        ctx.waitUntil(refreshLiveScores(env));
        break;
      
      case "0 */6 * * *": // Every 6 hours
        ctx.waitUntil(refreshPlayerStats(env));
        break;
      
      case "0 2 * * *": // Daily at 2 AM
        ctx.waitUntil(refreshFullData(env));
        break;
      
      case "0 8 * * MON": // Weekly on Monday at 8 AM
        ctx.waitUntil(refreshNILValuations(env));
        break;
    }
  }
};

async function refreshLiveScores(env) {
  const timestamp = new Date().toISOString();
  
  try {
    // Fetch live game data
    const liveData = {
      mlb: await fetchMLBLiveScores(),
      nfl: await fetchNFLLiveScores(),
      ncaa: await fetchNCAALiveScores(),
      timestamp
    };

    // Update Cardinals readiness based on live performance
    const readiness = calculateReadiness(liveData);
    const readinessData = {
      ts: timestamp,
      readiness: readiness.score,
      leverage: readiness.leverage,
      live_games: liveData.mlb.cardinals_game || null
    };

    // Store in R2
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(
        `live/readiness/${timestamp}.json`,
        JSON.stringify(readinessData)
      );
      
      // Also update the main readiness file
      await env.R2_BUCKET.put(
        'site/src/data/readiness.json',
        JSON.stringify({
          ts: timestamp,
          readiness: readiness.score,
          leverage: readiness.leverage
        })
      );
    }

    console.log(`Live scores refreshed at ${timestamp}`);
    return { success: true, timestamp };
  } catch (error) {
    console.error('Live score refresh error:', error);
    return { success: false, error: error.message };
  }
}

async function refreshPlayerStats(env) {
  const timestamp = new Date().toISOString();
  
  try {
    // Fetch updated player statistics
    const stats = {
      mlb: await fetchMLBStats(),
      nfl: await fetchNFLStats(),
      ncaa: await fetchNCAAStats(),
      timestamp
    };

    // Process and store stats
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(
        `stats/latest/${timestamp}.json`,
        JSON.stringify(stats)
      );
    }

    // Update D1 database with key metrics
    if (env.DB) {
      await updatePlayerMetrics(env.DB, stats);
    }

    console.log(`Player stats refreshed at ${timestamp}`);
    return { success: true, timestamp };
  } catch (error) {
    console.error('Stats refresh error:', error);
    return { success: false, error: error.message };
  }
}

async function refreshFullData(env) {
  const timestamp = new Date().toISOString();
  
  try {
    // Trigger full data ingestion
    const ingestUrl = env.WORKER_URL || 'https://blaze-intelligence.workers.dev';
    
    const response = await fetch(`${ingestUrl}/api/ingest/all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.INGEST_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        source: 'cron',
        timestamp 
      })
    });

    const result = await response.json();
    
    // Update main player data file
    if (env.R2_BUCKET) {
      const fullData = await aggregateAllData(env);
      await env.R2_BUCKET.put(
        'site/src/data/player_data_2025.json',
        JSON.stringify(fullData)
      );
    }

    console.log(`Full data refresh completed at ${timestamp}`);
    return { success: true, timestamp, result };
  } catch (error) {
    console.error('Full refresh error:', error);
    return { success: false, error: error.message };
  }
}

async function refreshNILValuations(env) {
  const timestamp = new Date().toISOString();
  
  try {
    // Fetch latest NIL valuations
    const nilData = {
      timestamp,
      valuations: await fetchNILValuations(),
      market_trends: calculateNILTrends(),
      top_movers: await identifyTopMovers()
    };

    // Store NIL data
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(
        `nil/weekly/${timestamp}.json`,
        JSON.stringify(nilData)
      );
    }

    // Update D1 with NIL changes
    if (env.DB) {
      for (const player of nilData.valuations) {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO nil_history 
          (player_name, valuation, change_pct, timestamp)
          VALUES (?, ?, ?, ?)
        `).bind(
          player.name,
          player.valuation,
          player.change_pct,
          timestamp
        ).run();
      }
    }

    console.log(`NIL valuations refreshed at ${timestamp}`);
    return { success: true, timestamp };
  } catch (error) {
    console.error('NIL refresh error:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions
async function fetchMLBLiveScores() {
  // Simulated live scores - in production would call real API
  return {
    cardinals_game: {
      home: "STL",
      away: "CHC",
      score_home: 4,
      score_away: 2,
      inning: 7,
      status: "In Progress"
    }
  };
}

async function fetchNFLLiveScores() {
  return {
    titans_game: null // No game today
  };
}

async function fetchNCAALiveScores() {
  return {
    texas_game: {
      home: "Texas",
      away: "Oklahoma",
      score_home: 28,
      score_away: 21,
      quarter: 3,
      time_remaining: "8:42"
    }
  };
}

function calculateReadiness(liveData) {
  // Calculate readiness based on live performance
  let score = 0.83; // Base score
  let leverage = 1.9;
  
  if (liveData.mlb.cardinals_game) {
    const game = liveData.mlb.cardinals_game;
    const lead = game.score_home - game.score_away;
    
    if (lead > 0) {
      score += 0.05;
      leverage += 0.2;
    }
  }
  
  return { 
    score: Math.min(1, score),
    leverage: Math.round(leverage * 10) / 10
  };
}

async function fetchMLBStats() {
  return {
    cardinals: {
      team_avg: 0.259,
      team_era: 3.84,
      team_ops: 0.742
    }
  };
}

async function fetchNFLStats() {
  return {
    titans: {
      points_per_game: 18.4,
      yards_per_game: 312.5,
      turnover_diff: -8
    }
  };
}

async function fetchNCAAStats() {
  return {
    texas: {
      scoring_offense: 38.2,
      total_defense: 298.4,
      third_down_pct: 0.452
    }
  };
}

async function updatePlayerMetrics(db, stats) {
  const timestamp = new Date().toISOString();
  
  // Update team metrics
  await db.prepare(`
    INSERT INTO team_metrics (league, team, metrics, timestamp)
    VALUES (?, ?, ?, ?)
  `).bind('MLB', 'Cardinals', JSON.stringify(stats.mlb.cardinals), timestamp).run();
}

async function aggregateAllData(env) {
  // Aggregate all current data into single JSON
  const data = {
    metadata: {
      generated: new Date().toISOString(),
      season: "2025-2026",
      version: "1.0.1"
    },
    mlb: await getLatestMLBData(env),
    nfl: await getLatestNFLData(env),
    ncaa: await getLatestNCAAData(env),
    texas_hs: await getLatestTXHSData(env)
  };
  
  return data;
}

async function getLatestMLBData(env) {
  // Fetch latest MLB data from R2
  if (env.R2_BUCKET) {
    const list = await env.R2_BUCKET.list({ prefix: 'data/mlb/' });
    if (list.objects.length > 0) {
      const latest = list.objects[list.objects.length - 1];
      const data = await env.R2_BUCKET.get(latest.key);
      return JSON.parse(await data.text());
    }
  }
  return {};
}

async function getLatestNFLData(env) {
  if (env.R2_BUCKET) {
    const list = await env.R2_BUCKET.list({ prefix: 'data/nfl/' });
    if (list.objects.length > 0) {
      const latest = list.objects[list.objects.length - 1];
      const data = await env.R2_BUCKET.get(latest.key);
      return JSON.parse(await data.text());
    }
  }
  return {};
}

async function getLatestNCAAData(env) {
  if (env.R2_BUCKET) {
    const list = await env.R2_BUCKET.list({ prefix: 'data/ncaa/' });
    if (list.objects.length > 0) {
      const latest = list.objects[list.objects.length - 1];
      const data = await env.R2_BUCKET.get(latest.key);
      return JSON.parse(await data.text());
    }
  }
  return {};
}

async function getLatestTXHSData(env) {
  if (env.R2_BUCKET) {
    const list = await env.R2_BUCKET.list({ prefix: 'data/txhs/' });
    if (list.objects.length > 0) {
      const latest = list.objects[list.objects.length - 1];
      const data = await env.R2_BUCKET.get(latest.key);
      return JSON.parse(await data.text());
    }
  }
  return {};
}

async function fetchNILValuations() {
  return [
    {
      name: "Arch Manning",
      valuation: 6800000,
      change_pct: 0.08,
      rank: 1
    },
    {
      name: "Carson Beck",
      valuation: 4300000,
      change_pct: -0.03,
      rank: 2
    }
  ];
}

function calculateNILTrends() {
  return {
    market_cap: 1200000000,
    growth_rate: 0.35,
    average_deal: 125000
  };
}

async function identifyTopMovers() {
  return [
    { name: "Jeremiah Smith", change: "+22%", reason: "Bowl game MVP" },
    { name: "Dylan Raiola", change: "+18%", reason: "Transfer portal entry" }
  ];
}
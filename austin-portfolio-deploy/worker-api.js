/**
 * Blaze Intelligence Worker API
 * Unified data access layer for sports intelligence platform
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Catalog endpoint
      if (url.pathname === '/api/catalog') {
        try {
          const catalogData = await env.BLAZE_STORAGE.get('data/catalog/index.json');
          if (!catalogData) {
            return errorResponse('Catalog not found', 404, corsHeaders);
          }
          
          return new Response(catalogData, {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300' // 5 minute cache
            },
          });
        } catch (error) {
          return errorResponse('Failed to fetch catalog', 500, corsHeaders);
        }
      }

      // Search endpoint
      if (url.pathname === '/api/search') {
        const query = url.searchParams.get('q');
        const sport = url.searchParams.get('sport');
        const league = url.searchParams.get('league');
        const contentType = url.searchParams.get('type');
        
        if (!query) {
          return errorResponse('Search query is required', 400, corsHeaders);
        }

        try {
          const catalogData = await env.BLAZE_STORAGE.get('data/catalog/index.json');
          if (!catalogData) {
            return errorResponse('Search index not available', 503, corsHeaders);
          }

          const catalog = JSON.parse(catalogData);
          const results = searchCatalog(catalog.items, query, { sport, league, contentType });
          
          return new Response(JSON.stringify({
            query,
            results,
            total: results.length,
            facets: catalog.facets
          }), {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=60' // 1 minute cache for search
            },
          });
        } catch (error) {
          return errorResponse('Search failed', 500, corsHeaders);
        }
      }

      // Team analytics endpoint
      if (url.pathname.startsWith('/api/teams/')) {
        const pathParts = url.pathname.split('/');
        const teamSlug = pathParts[3];
        
        if (!teamSlug) {
          return errorResponse('Team identifier is required', 400, corsHeaders);
        }

        try {
          // Map team slugs to data files
          const teamDataMap = {
            'cardinals': 'data/dashboard-config.json',
            'stl': 'data/dashboard-config.json',
            'titans': 'data/analytics/titans-latest.json',
            'ten': 'data/analytics/titans-latest.json',
            'longhorns': 'data/analytics/longhorns-latest.json',
            'texas': 'data/analytics/longhorns-latest.json',
            'grizzlies': 'data/analytics/grizzlies-latest.json',
            'mem': 'data/analytics/grizzlies-latest.json'
          };

          const dataPath = teamDataMap[teamSlug.toLowerCase()];
          if (!dataPath) {
            return errorResponse('Team not found', 404, corsHeaders);
          }

          const teamData = await env.BLAZE_STORAGE.get(dataPath);
          if (!teamData) {
            return errorResponse('Team data not available', 404, corsHeaders);
          }

          return new Response(teamData, {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=120' // 2 minute cache
            },
          });
        } catch (error) {
          return errorResponse('Failed to fetch team data', 500, corsHeaders);
        }
      }

      // Asset proxy endpoint
      if (url.pathname.startsWith('/api/assets/')) {
        const assetKey = url.pathname.replace('/api/assets/', '');
        
        if (!assetKey) {
          return errorResponse('Asset key is required', 400, corsHeaders);
        }

        try {
          const asset = await env.BLAZE_STORAGE.get(assetKey);
          if (!asset) {
            return errorResponse('Asset not found', 404, corsHeaders);
          }

          // Determine content type based on file extension
          const contentType = getContentType(assetKey);
          
          return new Response(asset, {
            headers: { 
              ...corsHeaders, 
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600' // 1 hour cache for assets
            },
          });
        } catch (error) {
          return errorResponse('Failed to fetch asset', 500, corsHeaders);
        }
      }

      // Dataset list endpoint
      if (url.pathname === '/api/datasets') {
        try {
          const catalogData = await env.BLAZE_STORAGE.get('data/catalog/index.json');
          if (!catalogData) {
            return errorResponse('Dataset catalog not available', 503, corsHeaders);
          }

          const catalog = JSON.parse(catalogData);
          const datasets = catalog.items.filter(item => 
            ['dataset', 'dashboard'].includes(item.content_type)
          );
          
          return new Response(JSON.stringify({
            datasets,
            total: datasets.length,
            facets: catalog.facets
          }), {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300'
            },
          });
        } catch (error) {
          return errorResponse('Failed to fetch datasets', 500, corsHeaders);
        }
      }

      // Default 404
      return errorResponse('Endpoint not found', 404, corsHeaders);
      
    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse('Internal server error', 500, corsHeaders);
    }
  },
};

/**
 * Search through catalog items
 */
function searchCatalog(items, query, filters = {}) {
  const normalizedQuery = query.toLowerCase();
  
  return items.filter(item => {
    // Text search
    const searchFields = [
      item.title,
      item.summary || '',
      item.tags?.join(' ') || '',
      item.teams?.join(' ') || '',
      item.sport,
      item.league
    ].join(' ').toLowerCase();
    
    const matchesQuery = searchFields.includes(normalizedQuery);
    
    // Filter by facets
    const matchesSport = !filters.sport || item.sport?.toLowerCase() === filters.sport.toLowerCase();
    const matchesLeague = !filters.league || item.league?.toLowerCase() === filters.league.toLowerCase();
    const matchesType = !filters.contentType || item.content_type === filters.contentType;
    
    return matchesQuery && matchesSport && matchesLeague && matchesType;
  });
}

/**
 * Get content type based on file extension
 */
function getContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const typeMap = {
    'json': 'application/json',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav'
  };
  
  return typeMap[ext] || 'application/octet-stream';
}

/**
 * Create RFC 7807 compliant error response
 */
function errorResponse(message, status = 500, corsHeaders = {}) {
  return new Response(JSON.stringify({
    type: 'about:blank',
    title: getStatusText(status),
    status,
    detail: message,
    instance: new Date().toISOString()
  }), {
    status,
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/problem+json' 
    },
  });
}

/**
 * Get HTTP status text
 */
function getStatusText(status) {
  const statusTexts = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  };
  
  return statusTexts[status] || 'Error';
}
/**
 * Cloudflare Worker for Blaze Intelligence R2 Storage Management
 * Handles sports data storage, retrieval, and management
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      // Route handling
      if (path.startsWith('/api/data/')) {
        return handleDataAPI(request, env, path, corsHeaders);
      } else if (path === '/api/health') {
        return handleHealthCheck(corsHeaders);
      } else {
        return new Response('Not Found', { 
          status: 404,
          headers: corsHeaders 
        });
      }
    } catch (error) {
      console.error('Storage Worker Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  },
};

async function handleHealthCheck(corsHeaders) {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'blaze-intelligence-storage',
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

async function handleDataAPI(request, env, path, corsHeaders) {
  const segments = path.split('/').filter(s => s);
  // segments: ['api', 'data', 'sport', 'dataset']
  
  if (segments.length < 3) {
    return new Response('Invalid path', { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const sport = segments[2]; // mlb, nfl, cfb
  const dataset = segments[3] || 'index'; // specific dataset name

  switch (request.method) {
    case 'GET':
      return getData(env.BLAZE_STORAGE, sport, dataset, corsHeaders);
    case 'POST':
    case 'PUT':
      return storeData(env.BLAZE_STORAGE, sport, dataset, request, corsHeaders);
    case 'DELETE':
      return deleteData(env.BLAZE_STORAGE, sport, dataset, corsHeaders);
    default:
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
  }
}

async function getData(bucket, sport, dataset, corsHeaders) {
  try {
    const key = `sports-data/${sport}/${dataset}.json`;
    const object = await bucket.get(key);

    if (!object) {
      return new Response(JSON.stringify({
        error: 'Dataset not found',
        sport,
        dataset
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const data = await object.json();
    
    return new Response(JSON.stringify({
      data,
      metadata: {
        sport,
        dataset,
        lastModified: object.uploaded,
        size: object.size
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minute cache
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch data',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function storeData(bucket, sport, dataset, request, corsHeaders) {
  try {
    const data = await request.json();
    const key = `sports-data/${sport}/${dataset}.json`;
    
    // Add metadata
    const enrichedData = {
      ...data,
      metadata: {
        sport,
        dataset,
        lastUpdated: new Date().toISOString(),
        source: 'blaze-intelligence-api'
      }
    };

    await bucket.put(key, JSON.stringify(enrichedData, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
      },
      customMetadata: {
        sport,
        dataset,
        updatedBy: 'blaze-intelligence'
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Data stored successfully',
      key,
      size: JSON.stringify(enrichedData).length
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error storing data:', error);
    return new Response(JSON.stringify({
      error: 'Failed to store data',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function deleteData(bucket, sport, dataset, corsHeaders) {
  try {
    const key = `sports-data/${sport}/${dataset}.json`;
    await bucket.delete(key);

    return new Response(JSON.stringify({
      success: true,
      message: 'Dataset deleted successfully',
      key
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error deleting data:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete data',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}
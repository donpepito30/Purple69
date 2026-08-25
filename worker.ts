export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- SEGURIDAD A NIVEL DE CÓDIGO (Sin variables de entorno) ---
    const ALLOWED_ORIGIN = '*';
    const origin = request.headers.get('Origin') || '';
    const userAgent = request.headers.get('User-Agent') || '';

    if (!userAgent || userAgent.trim() === '') {
      return new Response(JSON.stringify({ error: 'User-Agent header is required' }), { 
        status: 400, headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (ALLOWED_ORIGIN !== '*' && origin && !origin.includes(ALLOWED_ORIGIN)) {
      return new Response(JSON.stringify({ error: 'Unauthorized Origin. Access Denied.' }), { 
        status: 403, headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (url.pathname === '/api/models') {
      try {
        const allowedParams = ['limit', 'gender', 'tags', 'search', 'status', 'isLovenseOnly', 'isHdOnly', 'language', 'profileEthnicity', 'profileHairColor', 'profileBodyType', 'sort'];
        const safeParams = new URLSearchParams();

        url.searchParams.forEach((value, key) => {
          if (allowedParams.includes(key)) {
            const sanitizedValue = value.replace(/[^\w\s\-\.,ñáéíóúÁÉÍÓÚ]/gi, '').trim();
            if (sanitizedValue) safeParams.append(key, sanitizedValue);
          }
        });

        let limitVal = parseInt(safeParams.get('limit') || '300', 10);
        if (isNaN(limitVal) || limitVal < 1 || limitVal > 500) limitVal = 300;
        safeParams.set('limit', limitVal.toString());
        safeParams.set('status', 'public');

        const cacheUrl = new URL(request.url);
        const cache = caches.default;
        let response = await cache.match(cacheUrl);
        if (response) return response;

        const targetUrl = new URL('https://go.whitetrafsa.com/api/models');
        safeParams.forEach((value, key) => targetUrl.searchParams.append(key, value));

        const apiRes = await fetch(targetUrl.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
          }
        });

        if (!apiRes.ok) {
          const errorText = await apiRes.text();
          return new Response(JSON.stringify({
            error: `API Afiliados bloqueó o falló con status ${apiRes.status}`,
            responseSnippet: errorText.slice(0, 300)
          }), { status: apiRes.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        const rawData = await apiRes.json();
        const modelsList = Array.isArray(rawData) ? rawData : (rawData.models || rawData.data || []);
        
        const formattedModels = modelsList.map((m) => ({
          ...m,
          id: m.id || m.username,
          username: m.username || '',
          displayName: m.display_name || m.displayName || m.username || '',
          age: m.age || 18,
          country: m.country || '',
          countryCode: m.country_code || m.countryCode || '',
          gender: m.gender || 'female',
          status: m.status || 'online',
          isLive: m.status === 'public' || m.isLive || true,
          avatarUrl: m.avatarUrl || m.avatar_url || `https://img.strpst.com/images/avatars/${m.username}.jpg`,
          snapshotUrl: m.snapshotUrl || m.snapshot_url || m.popularSnapshotUrl || `https://img.strpst.com/images/vthumbs/${m.username}.jpg`,
          iframeEmbedUrl: m.iframeEmbedUrl || m.iframe_embed_url || `https://stripchat.com/embed/${m.username}`,
          viewersCount: m.viewersCount || m.viewers_count || m.viewers || 0,
          rating: m.rating || 0,
          favoriteCount: m.favoriteCount || m.favorite_count || 0,
          rank: m.rank || 9999,
          topic: m.topic || '',
          tags: m.tags || [],
          languages: m.languages || [],
          ethnicity: m.ethnicity || m.profileEthnicity || '',
          bodyType: m.bodyType || m.profileBodyType || '',
          hairColor: m.hairColor || m.profileHairColor || '',
          tokensPerMin: m.tokensPerMin || m.tokens_per_min || 0,
          isHd: !!(m.isHd || m.is_hd),
          isVr: !!(m.isVr || m.is_vr),
          isLovense: !!(m.isLovense || m.is_lovense),
          broadcastMobile: !!m.broadcastMobile,
          streamWidth: m.stream?.width || 0,
          streamHeight: m.stream?.height || 0,
          avatar: m.avatarUrl || m.avatar_url || `https://img.strpst.com/images/avatars/${m.username}.jpg`,
          thumbnail: m.snapshotUrl || m.snapshot_url || m.popularSnapshotUrl || `https://img.strpst.com/images/vthumbs/${m.username}.jpg`,
          embedUrl: m.iframeEmbedUrl || m.iframe_embed_url || `https://stripchat.com/embed/${m.username}`,
          affiliateUrl: m.affiliateUrl || m.affiliate_url || `https://stripcash.com/live/${m.username}?aff=aff_velvet_101`
        }));

        response = new Response(JSON.stringify(formattedModels), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=120'
          }
        });

        ctx.waitUntil(cache.put(cacheUrl, response.clone()));
        return response;
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Excepción en Cloudflare Worker', details: err.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (url.pathname === '/api/gemini/chat') {
      try {
        let body = {};
        if (request.method === 'POST') {
          body = await request.json().catch(() => ({}));
        }
        const { modelUsername } = body;
        let responseText = '¡Hola! Gracias por tu mensaje en el chat.';
        if (modelUsername) {
          responseText = `¡Hola amor! Soy ${modelUsername}, gracias por tu mensaje. ¡Disfruta el show!`;
        }
        return new Response(JSON.stringify({ text: responseText }), {
          status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ text: '¡Hola! Gracias por tu mensaje. ¡Disfruta el show en vivo!' }), {
          status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (env.ASSETS) {
      try {
        let response = await env.ASSETS.fetch(request);
        if (response.status === 404) {
          const indexUrl = new URL(request.url);
          indexUrl.pathname = '/index.html';
          return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
        }
        return response;
      } catch (e) {
        return new Response("Error sirviendo assets: " + String(e), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  export async function proxyFetch(url, options = {}) {
    let response;
    
    try {
      response = await fetch(url, options);
      if (!response.ok) {
        throw new Error('Fetch without proxy failed');
      }
    } catch (error) {
      console.log(error);
      const proxyListResponse = await fetch('https://www.proxyscan.io/api/proxy?limit=5&not_country=cn,ir,kp,ru,by,ua,ve&ping=500&uptime=50');
      const proxyList = await proxyListResponse.json();
  
      for (const proxy of proxyList) {
        const headers = new Headers(options.headers || {});
        headers.set('Host', new URL(url).host);
        headers.set('Referer', url);
        headers.set('X-Requested-With', 'XMLHttpRequest');
        headers.set('Proxy-Authorization', `Basic ${btoa(`${proxy.Ip}:${proxy.Port}`)}`);
        const proxyOptions = {
          ...options,
          headers,
          mode: 'cors',
          proxy: `http://${proxy.Ip}:${proxy.Port}`,
        };
        try {
          response = await fetch(url, proxyOptions);
          if (response.ok) {
            break;
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  
    return response;
  }
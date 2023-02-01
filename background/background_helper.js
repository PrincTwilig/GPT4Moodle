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
    } catch (error) {
        console.error(error);
        const proxyListResponse = await fetch('https://www.proxyscan.io/api/proxy?limit=20&not_country=cn,ir,kp,ru,by,ua,ve&ping=500&uptime=50');
        const proxyList = await proxyListResponse.json();

        for (const proxy of proxyList) {
        try {
            response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Host': new URL(url).host,
                'Referer': url,
            },
            agent: new HttpsProxyAgent(`http://${proxy.Ip}:${proxy.Port}`),
            });
            if (response.ok) {
            break;
            }
        } catch (error) {
            console.error(error);
        }
        }
    }

    if (!response.ok) {
        throw new Error('PROXYFAILED');
    }

    return response;
}
import { uuidv4, proxyFetch } from "./background_helper.js"


const accessTokenCache = new Map();

async function getAccessToken() {
  if (accessTokenCache.has('accessToken')) {
    return accessTokenCache.get('accessToken');
  }

  const resp = await proxyFetch('https://chat.openai.com/api/auth/session');

  if (resp.status === 403) {
    throw new Error('CLOUDFLARE');
  }

  const data = await resp.json();

  if (!data.accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  accessTokenCache.set('accessToken', data.accessToken);
  return data.accessToken;
}

function data_to_text(data) {
  try {
    let temp = data.split('\n\n')
    temp = temp[temp.length-3]
    temp = temp.slice(6)
    temp = temp.replace(/(\r\n|\n|\r)/gm, "");

    const json_data = JSON.parse(temp)
    const text = json_data.message.content.parts[0]
    const conversationId = json_data.conversation_id

    return {
      'text': text,
      'conversationId': conversationId
    }
  } catch (error) {
    console.log(`Errore in data retrieved!\n${error.message}`)
    return {
      'text': "UNKNOWNERROR",
      'conversationId': "some-random-id"
    }
  }
}

export default async function generateAnswer(question) {
  try {
    const accessToken = await getAccessToken();
    const resp = await proxyFetch('https://chat.openai.com/backend-api/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: 'next',
        messages: [
          {
            id: uuidv4(),
            role: 'user',
            content: {
              content_type: 'text',
              parts: [question],
            },
          },
        ],
        model: 'text-davinci-002-render',
        parent_message_id: uuidv4(),
      }),
    })

    const string_data = await resp.text()


    if (string_data.includes('Only one message at a time.')) {
      return "SECONDMSG"
    }
    if (string_data.includes('Too many requests in 1 hour')) {
      return "OVERLOAD"
    }
    if (string_data.includes("We're currently processing too many requests.")) {
      return "SERVEROVERLOAD"
    }
    
    const data = data_to_text(string_data)

    return data.text;
  } catch (error) {
    if (error.message === 'CLOUDFLARE' || error.message === 'UNAUTHORIZED'){
      return "CLOUDFLARE/UNAUTHORIZED";
    } else if (error.message === 'PROXYFAILED') {
      return "PROXYFAILED"
    } else {
      console.error(error);
      accessTokenCache.delete('accessToken');
      throw error;
    }
  }
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  

const accessTokenCache = new Map();

async function getAccessToken() {
  if (accessTokenCache.has('accessToken')) {
    return accessTokenCache.get('accessToken');
  }

  const resp = await fetch('https://chat.openai.com/api/auth/session');

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
    let temp = data.split('\n\n')
    temp = temp[temp.length-3]
    temp = temp.slice(6)
    temp = temp.replace(/(\r\n|\n|\r)/gm, "");

    const json_data = JSON.parse(temp)
    const text = json_data.message.content.parts[0]

    return text
}

export default async function generateAnswer(question) {
  try {
    const accessToken = await getAccessToken();
    const resp = await fetch('https://chat.openai.com/backend-api/conversation', {
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
    const text = data_to_text(string_data)

    console.log(text)
    return text;
  } catch (error) {
    console.error(error);
    accessTokenCache.delete('accessToken');
    throw error;
  }
}
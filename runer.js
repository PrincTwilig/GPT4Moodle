class GPTConfig {
  constructor() {
    this.data = {
      mode: 'on',
      status: 'ready',
    };
  }

  async load() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.data, (items) => {
        this.data = { ...this.data, ...items };
        resolve();
      });
    });
  }

  async save() {
    return new Promise((resolve) => {
      chrome.storage.sync.set(this.data, () => {
        resolve();
      });
    });
  }
}

const config = new GPTConfig();
  
class QuizQuestion {
    constructor(element) {
      this.element = element;
      this.clearfix = element.getElementsByClassName('formulation clearfix')[0];
      this.answer = this.createAnswer();
      this.answerBlock = this.createAnswerBlock();
      this.answerButton = this.createAnswerButton();
    }
  
    createAnswer() {
      let answer = document.createElement('div');
      let answerBlock = document.createElement('div');
      answer.classList.add('answer_button');
      answer.appendChild(answerBlock);
      answer.innerHTML = '?';
      this.clearfix.appendChild(answer);
      return answer;
    }

    createAnswerBlock() {
        let answerBlock = document.createElement('div');
        answerBlock.classList.add('answer_block');
        this.answer.appendChild(answerBlock)
        return answerBlock
    }
  
    createAnswerButton() {
      let button = document.createElement('BUTTON');
      let img = document.createElement('img');
      img.classList.add('buttonimg');
      img.src = 'https://as1.ftcdn.net/v2/jpg/05/61/30/84/1000_F_561308400_YdQTUBFH9TaX3nbSiKqLjiJN4N2REoA3.png';
      button.innerHTML = img.outerHTML + '  Answer';
      button.classList.add('answerButton');
      this.clearfix.appendChild(button);
      return button;
    }
  
    async getAnswer() {
      await config.load();
      this.answer.style.visibility = 'visible';
      if (config.data.status === 'ready') {
        config.data.status = 'working';
        config.save();
        
        this.answerBlock.innerHTML = 'Generating answer...';
        let question = this.getQuestion();
        let response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ functionName: 'generateAnswer', input: question }, (response) => {
            resolve(response);
          });
        });
        
        const response_error = this.error_check(response.answer)
        if (response_error) {
          this.answerBlock.innerHTML = response_error;
          config.data.status = 'ready';
          config.save();
          return 
        }

        let answer = JSON.parse(response.answer.replace(/(\r\n|)/g, ''));

        this.markRightQuestion(answer.letter);
        this.answerBlock.innerHTML = answer.explanation;

        config.data.status = 'ready';
        config.save();
        return 'done'
      }else {
        this.answerBlock.innerHTML = 'Answer generation in progress, try again later.';
       }
    }

    error_check(response_text) {
      let response_error = false
      if (response_text === 'CLOUDFLARE/UNAUTHORIZED') {
        response_error =
          'Login or pass cloudflare <a target="_blank" href="https://chat.openai.com/chat">ChatGPT</a>';
      }
      if (response_text === 'SECONDMSG') {
        response_error = 'Only one block at a time!';
      }
      if (response_text === 'OVERLOAD') {
        response_error = 'Too many requsts on one hour, try again later.';
      }
      if (response_text === "UNKNOWNERROR") {
        response_error = 'Unknown error ocured, try to reload page or wait!';
      }
      return response_error
    }
    
    markRightQuestion(letter) {
        this.element.querySelectorAll('.d-flex.w-100').forEach(block => {
            const answer = block.querySelectorAll('.answernumber')[0]
            if (answer.innerHTML[0] === letter) {
                block.style.fontWeight = 'bold';
            }
        })
    }

    getQuestion() {
        let dict = {};
    
        this.element.querySelectorAll('.d-flex.w-100').forEach((ans) => {
            let answernumber = ans.getElementsByClassName('answernumber')[0].innerHTML[0];
            let text = ans.getElementsByClassName('flex-fill')[0].innerHTML;
            dict[answernumber] = text;
        });
    
        const prompt = {
            'question': this.element.getElementsByClassName('qtext')[0].innerHTML,
            'answers': dict
        };
    
        let request = "Нижче буде наведене питання і варіанти відповіді, вибери одну правильну відповідь, та запиши відповідь в форматі json з двома ключами letter(буква відповіді) та explanation(пояснення чому ця відповідь), напиши відповідь лише у json нічого іншого\n\n";
    
        request += `${prompt.question}\n`;
    
        for (let key in prompt.answers) {
            request += `${key}. ${prompt.answers[key]}\n`;
        }
    
        return request;
    }
}
function quizes() {
  let elements = document.getElementsByClassName('que multichoice');
  for (let i = 0; i < elements.length; i++) {
    let question = new QuizQuestion(elements[i]);
    question.answerButton.addEventListener('click', async function() {
      const status = await question.getAnswer();
      if (status === 'done') {
        question.answerButton.removeEventListener('click', arguments.callee, false)
      }
    });
  }
}

async function run() {
  await config.load()

  if (config.data.mode === 'on') {
    quizes();
  }
}

run()
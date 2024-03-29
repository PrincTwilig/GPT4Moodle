class GPTConfig {
  constructor() {
    this.data = {
      mode: "on",
      status: "ready",
    };
    this.load();
  }

  async load() {
    const items = await chrome.storage.sync.get(["GPTConfig"]);
    this.data = { ...this.data, ...items.GPTConfig };
  }

  save() {
    chrome.storage.sync.set({ GPTConfig: this.data });
  }
}

const config = new GPTConfig();

class QuizQuestion {
  constructor(element) {
    this.element = element;
    this.clearfix = element.getElementsByClassName("formulation clearfix")[0];
    this.answerButton = this.createAnswerButton();
  }

  createAnswerButton() {
    let button = document.createElement("BUTTON");
    let img = document.createElement("img");
    let text = document.createElement("p");

    button.classList.add("answerButton", "answerButtonH");

    img.src = chrome.runtime.getURL("picture/ChatGPT.png");
    text.innerHTML = "Answer";

    button.appendChild(img);
    button.appendChild(text);

    this.clearfix.appendChild(button);
    return button;
  }

  createAnswerBlock() {
    let answerBlock = document.createElement("div");
    answerBlock.classList.add("answer_block");
    this.answerButton.appendChild(answerBlock);
    return answerBlock;
  }

  async getAnswer() {
    config.load();
    if (config.data.status === "ready") {
      config.data.status = "working";
      config.save();

      const img = this.answerButton.getElementsByTagName("img")[0];

      try {
        this.answerButton.removeChild(
          this.answerButton.getElementsByTagName("div")[0]
        );
      } catch {}

      this.answerButton.classList.remove("answerButtonE", "answerButtonR");

      this.answerButton.classList.remove("answerButtonH");
      this.answerButton.title = "Generating...";
      img.classList.add("rotation");

      let question = this.getQuestion();
      let response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { functionName: "generateAnswer", input: question },
          (response) => {
            resolve(response);
          }
        );
      });

      img.classList.remove("rotation");

      const answer_block = this.createAnswerBlock();
      this.answerButton.appendChild(answer_block);
      this.answerButton.title = "";

      const response_error = this.error_check(response.answer);
      if (response_error) {
        this.answerButton.classList.add("answerButtonE");

        this.typeText(answer_block, response_error);

        config.data.status = "ready";
        config.save();
        return;
      }

      let answer
      try {
        answer = JSON.parse(response.answer.replace(/(\r\n|)/g, ""));
      } catch {
        answer = `Failed to parse:\n${response.answer}`
      }

      this.markRightQuestion(answer.letter);
      this.typeText(answer_block, answer.explanation);
      this.answerButton.classList.add("answerButtonR");

      config.data.status = "ready";
      config.save();
      return "done";
    }
  }

  error_check(response_text) {
    let response_error = false;
    if (response_text === "CLOUDFLARE/UNAUTHORIZED") {
      response_error =
        'Login or pass cloudflare <a target="_blank" href="https://chat.openai.com/chat">ChatGPT</a>, then try again.';
    }
    if (response_text === "SECONDMSG") {
      response_error =
        "Only one block at a time. Try again when other block finish.";
    }
    if (response_text === "OVERLOAD") {
      response_error = "Too many requsts on one hour, try again later.";
    }
    if (response_text === "UNKNOWNERROR") {
      response_error = "Unknown error ocured, try to reload page or wait.";
    }
    if (response_text === "SERVEROVERLOAD") {
      response_error = "Server overload, too many requests, try again later.";
    }
    return response_error;
  }

  markRightQuestion(letter) {
    let answernumber = 1;
    this.element.querySelectorAll(".d-flex.w-100").forEach((block) => {
      if (answernumber == letter) {
        block.style.fontWeight = "bold";
      }
      answernumber = answernumber + 1;
    });
  }

  parseAnswersMethods = [
    () => { // method 1
      const dict = {};

      let answernumber = 1;
      this.element.querySelectorAll(".d-flex.w-100").forEach((ans) => {
        const text = ans.getElementsByClassName("flex-fill")[0].textContent;
        dict[answernumber] = text;
        answernumber = answernumber + 1;
      });

      return dict;
    },
    () => Object.fromEntries( // method 2
      Array.from(this.element.querySelectorAll('.answer label')).map(
        e => [e.querySelector('span').innerText.trim(), e.childNodes[1].data.trim()]
    ))
  ]

  getQuestion() {
    let answers = {}

    for (let i = 0; i < this.parseAnswersMethods.length && Object.keys(answers).length === 0; i++) {
      answers = this.parseAnswersMethods[i]();
    }

    const prompt = {
      question: this.element.getElementsByClassName("qtext")[0].textContent,
      answers
    };

    let request =
      "Below will be the question and answer options, choose one correct answer (choose the only correct answer, that covers question completely), and write the answer in json format with two keys, letter (answer number) and explanation (explanation why this answer is correct, make it on language of question) your answer must have json only, don't write anything but json in the given format\n\n";

    request += `${prompt.question}\n`;

    for (let key in prompt.answers) {
      request += `${key}. ${prompt.answers[key]}\n`;
    }

    return request;
  }

  typeText(element, text) {
    let i = 0;
    let typingInterval = setInterval(() => {
      if (i < text.length) {
        let currentChar = text.charAt(i);
        if (currentChar === "<") {
          // check if this is a link
          let linkStart = i;
          while (text.charAt(i) !== ">") {
            i++;
          }
          let linkEnd = i;
          let linkTag = text.substring(linkStart, linkEnd + 1);
          let linkHref = linkTag.match(/href="(.*?)"/)[1];
          let linkText = text.substring(
            linkEnd + 1,
            text.indexOf("</a>", linkEnd)
          );
          let link = document.createElement("a");
          link.innerHTML = linkText;
          link.href = linkHref;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          element.appendChild(link);
          i = text.indexOf("</a>", linkEnd) + 4;
        } else {
          element.innerHTML += currentChar;
        }
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 2000 / text.length);
  }
}

function quizes() {
  const elements = document.getElementsByClassName("que multichoice");
  for (let i = 0; i < elements.length; i++) {
    let question = new QuizQuestion(elements[i]);
    question.answerButton.addEventListener("click", async function (event) {
      event.preventDefault();
      const status = await question.getAnswer();
      if (status === "done") {
        question.answerButton.disabled = true;
        question.answerButton.removeEventListener(
          "click",
          arguments.callee,
          false
        );
      }
    });
  }
}

async function auto() {
  const elements = document.getElementsByClassName("que multichoice");
  let questions = [];

  for (let i = 0; i < elements.length; i++) {
    questions.push(new QuizQuestion(elements[i]));
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    await question.getAnswer();

    question.answerButton.addEventListener("click", async function (event) {
      event.preventDefault();
      const status = await question.getAnswer();
      if (status === "done") {
        question.answerButton.disabled = true;
        question.answerButton.removeEventListener(
          "click",
          arguments.callee,
          false
        );
      }
    });
  }
}

async function run() {
  await config.load();
  config.data.status = "ready";
  config.save();

  if (config.data.mode === "on") {
    quizes();
    return;
  }
  if (config.data.mode === "auto") {
    auto();
    return;
  }
}

run();

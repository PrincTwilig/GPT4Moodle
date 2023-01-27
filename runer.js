function create_buttons() {
    let quiz_boxes = document.querySelectorAll('.que.multichoice.deferredfeedback');
    quiz_boxes.forEach(function(element) {
        // creates button and listener
        let clearfix = element.getElementsByClassName("formulation clearfix")[0];

        let button = document.createElement("BUTTON");
        let img = document.createElement("img")

        img.classList.add('buttonimg')
        img.src = 'https://as1.ftcdn.net/v2/jpg/05/61/30/84/1000_F_561308400_YdQTUBFH9TaX3nbSiKqLjiJN4N2REoA3.png'

        button.innerHTML = img.outerHTML + "  Answer";
        button.classList.add('answerButton')

        clearfix.appendChild(button);

        button.addEventListener("click", function() {
            get_answer(element);
        });
    });
}

function create_descriptions() {
    let quiz_boxes = document.querySelectorAll('.que.multichoice.deferredfeedback');
    quiz_boxes.forEach(function(element) {
        let clearfix = element.getElementsByClassName("formulation clearfix")[0];

        let answer = document.createElement('div')
        let answer_block = document.createElement('div')

        answer_block.classList.add('answer_block')
        answer.classList.add('answer_button')

        answer.appendChild(answer_block)
        answer.innerHTML = answer_block.outerHTML + '?'

        clearfix.appendChild(answer)
    });
}


function runer() {
    create_buttons()
    create_descriptions()
}

runer()

function get_answer(element) {
    const quest = get_question(element)

    element.getElementsByClassName("answer_button")[0].classList.add('visible')

    element.getElementsByClassName('answer_block')[0].innerHTML = "Generating answer..."

    chrome.runtime.sendMessage({functionName: "generateAnswer", input: quest}, response => {
        const answer =  response.answer.replace(/(\r\n|\n|\r)/gm, "");
        console.log(answer)

        const answer_json = JSON.parse(answer)

        mark_answer(element, answer_json.letter)

        element.getElementsByClassName('answer_block')[0].innerHTML = answer_json.explanation
    });
}

function mark_answer(element, letter) {
    element.querySelectorAll('.d-flex.w-100').forEach((ans) => {
        if (ans.getElementsByClassName('answernumber')[0].innerHTML[0] === letter) {
            ans.classList.add('text-bolded')
        }
    })
}


function get_question(element) {
    let dict = {}

    element.querySelectorAll('.d-flex.w-100').forEach((ans) => {
        let answernumber = ans.getElementsByClassName('answernumber')[0].innerHTML[0]
        let text = ans.getElementsByClassName('flex-fill')[0].innerHTML
        dict[answernumber] = text
    })

    const promp = {
        'question': element.getElementsByClassName('qtext')[0].innerHTML,
        'answers': dict
    }

    let request = `Нижче буде наведене питання і варіанти відповіді, вибери одну правильну відповідь, та запиши відповідь в форматі json з двома ключами letter(буква відповіді) та explanation(пояснення чому ця відповідь), напиши відповідь лише у json нічого іншого\n\n`

    request += `${promp.question}\n`

    for (let key in promp.answers) {
        request += `${key}. ${promp.answers[key]}\n`
    }

    return request
}
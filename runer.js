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
    element.getElementsByClassName("answer_button")[0].classList.add('visible')
}
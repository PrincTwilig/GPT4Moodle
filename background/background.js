import generateAnswer from "./gptrequst.js"

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.functionName == "generateAnswer") {
          generateAnswer(request.input).then(answer => {
            sendResponse({answer: answer});
          })
          return true

        const answer = "Text"

        sendResponse({answer: answer});
      }
    });
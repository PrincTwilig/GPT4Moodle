const radioButtons = document.querySelectorAll('input[name="radioset"]')

chrome.storage.sync.get(["mode"]).then((result) => {
    if(result.mode === undefined)
        chrome.storage.sync.set({ mode: "on" })
});

for(let e of radioButtons){
    chrome.storage.sync.get(["mode"]).then((result) => {
        if(e.id === result.mode)
            e.checked = true
    });

    e.addEventListener("change", () =>{
        chrome.storage.sync.set({mode : e.id})
    })
}

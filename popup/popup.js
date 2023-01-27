
const selectElement = document.getElementById("mode");

// Use chrome storage to store state of select element
// if mode isn't specified we set On to it

chrome.storage.local.get(["mode"]).then((result) => {
    if(result.mode === undefined){
        chrome.storage.local.set({ mode: "On" })
    }
    selectElement.value = result.mode
});

const popupAction = () => {
    chrome.storage.local.set({ mode: selectElement.value })

};


document.getElementById("mode").addEventListener("change", popupAction)
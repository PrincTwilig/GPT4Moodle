const radioButtons = document.querySelectorAll('input[name="radioset"]')


function isObject(o) {
    return o instanceof Object && o.constructor === Object;
}

chrome.storage.sync.get(["GPTConfig"]).then((result) => {
    const config = isObject(result.GPTConfig) ? result.GPTConfig : {}

    if (config["mode"] === undefined) {
        config["mode"] = "on"
        chrome.storage.sync.set({GPTConfig: config})
    }
    for (let e of radioButtons) {
        if (e.id === config["mode"])
            e.checked = true


        e.addEventListener("change", () => {
            config["mode"] = e.id
            chrome.storage.sync.set({GPTConfig: config})
        })
    }
});



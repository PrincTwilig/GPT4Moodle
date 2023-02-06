class GPTConfig {
  constructor() {
    this.data = {
      mode: 'on',
      status: 'ready',
    };
    this.load();
  }

  async load() {
    const items = await chrome.storage.sync.get(["GPTConfig"])
    this.data = { ...this.data, ...items.GPTConfig }
  }

    save() {
    chrome.storage.sync.set({"GPTConfig": this.data})
  }
}

const config = new GPTConfig();


const radioButtons = document.querySelectorAll('input[name="radioset"]')

// chrome.storage.sync.remove("GPTConfig")

async function init() {
    await config.load()
    
    for (let e of radioButtons) {
        if (e.id === config.data.mode)
            e.checked = true


        e.addEventListener("change", () => {
            config.data.mode = e.id
            config.save()
        })
    }
}

init()
import icon from '../assets/icons/null.png'
import { App } from '../types.ts'

import { FlowWindow } from '../wm.ts'

export default class BrowserApp implements App {
  meta = {
    name: 'Browser',
    description: 'A simple browser app.',
    pkg: 'flow.browser',
    version: '1.0.0',
    icon
  }

  async open (): Promise<FlowWindow> {
    const win = window.wm.createWindow({
      title: this.meta.name,
      icon: this.meta.icon,
      width: 400,
      height: 300
    })

    win.content.style.height = '100%'
    win.content.style.display = 'flex'
    win.content.style.flexDirection = 'column'
    win.content.innerHTML = `
      <div style="display: flex;padding: 10px;gap: 10px;">
        <div id="tabs-container" style="display: flex;gap: 10px;"></div>
        <button class="add">+</button>
      </div>
      <div class="tools" style="display:flex;gap:10px;align-items:center;">
        <i class='back bx bx-left-arrow-alt'></i>
        <i class='forward bx bx-right-arrow-alt'></i>
        <i class='refresh bx bx-refresh'></i>
        <input class="inp" style="border-radius: 15px;flex: 1;background: var(--base);border:none;padding: 0px 16px;height: 30px;">
      </div>
      <div id="content-container"></div>
      <style>
        iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        #content-container {
          flex: 1;
        }
        .add {
          border: none;
          background: transparent;
        }
        #tabs-container > div {
          padding: 5px 10px;
        }
        .active {
          background: var(--surface-0);
          border-radius: 10px!important;
        }

        .tools {
          background: var(--surface-0);
          padding: 10px;
        }
      </style>
    `

    class Tab {
      active = false

      header = document.createElement('div')
      iframe: HTMLIFrameElement = document.createElement('iframe')

      constructor (url: string) {
        this.iframe.src = url
        this.iframe.style.display = 'none'

        this.header.innerHTML = `
          <span class="title">Tab</span>
          <span class="close">&times;</sp>
        `
      }
    }

    class TabManager {
      tabs: Tab[] = []
      tabHistory: Tab[] = []

      activeTab: Tab

      addTab (tab: Tab): void {
        this.tabs.push(tab)
        this.setActiveTab(tab);

        (tab.header.querySelector('.title') as HTMLElement).onclick = (): void => this.setActiveTab(tab);
        (tab.header.querySelector('.close') as HTMLElement).onclick = (): void => this.closeTab(tab)

        win.content.querySelector('#content-container')?.appendChild(tab.iframe)
        win.content.querySelector('#tabs-container')?.appendChild(tab.header)

        tab.iframe.onload = () => {
          (tab.header.querySelector('.title') as HTMLElement).textContent = tab.iframe.contentDocument?.title as string
          if (tab === this.activeTab) (win.content.querySelector('.inp') as HTMLInputElement).value = xor.decode((tab.iframe.contentWindow as Window).location.href.split('/service/')[1])
        }
      }

      closeTab (tab: Tab): void {
        tab.header.remove()
        tab.iframe.remove()

        if (tab.active) {
          const lastTab = win.content.querySelector('#tabs-container')?.lastElementChild
          if (lastTab !== undefined) (lastTab?.querySelector('.title') as HTMLElement).click()
          else this.addTab(new Tab(`/service/${xor.encode('https://google.com')}`))
        }
      }

      setActiveTab (tab: Tab): void {
        this.tabs.forEach((tab) => {
          if (tab.active) {
            tab.active = false
            tab.iframe.style.display = 'none'
            tab.header.classList.remove('active')
          }
        })

        try { (win.content.querySelector('.inp') as HTMLInputElement).value = xor.decode((tab.iframe.contentWindow as Window).location.href.split('/service/')[1]) } catch (e) { (win.content.querySelector('.inp') as HTMLInputElement).value = 'about:blank' }

        tab.active = true
        tab.iframe.style.display = 'block'
        tab.header.classList.add('active')

        this.activeTab = tab
        this.tabHistory.push(tab)
      }
    }

    const tabManager = new TabManager()

    win.content.querySelector('.inp')?.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        tabManager.activeTab.iframe.src = `/service/${xor.encode((win.content.querySelector('.inp') as HTMLInputElement).value)}`
      }
    })

    interface XOR {
      randomMax: number
      randomMin: number
      encode: (str: string) => string
      decode: (str: string) => string
    }

    const xor: XOR = {
      randomMax: 100,
      randomMin: -100,

      encode: (str: string): string => {
        return encodeURIComponent(
          str
            .toString()
            .split('')
            .map((char, ind): string => {
              let indCheck
              if (ind % 2 === 0) { indCheck = false } else { indCheck = true }

              return indCheck ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char
            })
            .join('')
        )
      },
      decode: (str: string): string => {
        const [input, ...search] = str.split('?')

        return (
          decodeURIComponent(input)
            .split('')
            .map((char, ind): string => {
              let indCheck
              if (ind % 2 === 0) { indCheck = false } else { indCheck = true }

              return indCheck ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char
            })
            .join('') + ((search.length > 0) ? '?' + search.join('?') : '')
        )
      }
    };

    (win.content.querySelector('button') as HTMLElement).onclick = () => {
      tabManager.addTab(new Tab(`/service/${xor.encode('https://google.com')}`))
    }

    (win.content.querySelector('.refresh') as HTMLElement).onclick = () => {
      tabManager.activeTab.iframe.contentWindow?.location.reload()
    }

    (win.content.querySelector('.back') as HTMLElement).onclick = () => {
      tabManager.activeTab.iframe.contentWindow?.history.back()
    }

    (win.content.querySelector('.forward') as HTMLElement).onclick = () => {
      tabManager.activeTab.iframe.contentWindow?.history.forward()
    }

    tabManager.addTab(new Tab(`/service/${xor.encode('https://google.com')}`))

    return win
  }
}
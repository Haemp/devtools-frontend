class TabbedView extends HTMLElement{

    constructor(){
        super();
        this.$ = this.attachShadow({mode: 'open'});

        this.$.innerHTML = `
            <style>
                ol{ margin: 0; padding: 0; }
                .tab.selected{ border-bottom: 2px solid blue; }
                .tab{
                    padding: 7px 12px;
                    background-color: #fff;
                    border:0;
                    outline: none;
                    cursor:pointer;
                }
                .tab:hover{
                    background-color: #ddd;
                }
            </style>
            <header>
                <ol id="tabs-header-list"></ol>
            </header>
            <section id="tab-content">
                <slot name="tabs"></slot>        
            </section> 
        `;

        this.tabHeaderList = this.$.querySelector('#tabs-header-list');
        this.tabContent = this.$.querySelector('#tab-content');
        this.contentSlot = this.$.querySelector('#tab-content slot');
        this.contentSlot.addEventListener('slotchange', _ => {
            this._getState();
            this.selectTab(this._selectedTab);
        })
    }



    connectedCallback(){

        this._getState();
        this.selectTab(this.getAttribute('default-tab'))
    }

    _getState(){
        this._tabs = [];
        this.contentSlot.assignedNodes().forEach(content => {
            this._tabs.push({
                name: content.getAttribute('tab-name'),
                id: content.getAttribute('tab-id'),
                content: content
            })
        })
    }

    _renderTabs(){
        this.tabHeaderList.innerHTML = ' ';
        this._tabs.forEach(tab => {
            const tabEl = document.createElement('button')
            tabEl.innerText = tab.name;
            tabEl.classList.add('tab')
            tabEl.addEventListener('click', () => {
                this.onTabClick(tab);
            })

            if(tab.id === this._selectedTab){
                tabEl.classList.add('selected')
            }

            this.tabHeaderList.appendChild(tabEl)

        })

    }

    selectTab(tabId){

        const visibleTab = this._tabs.find(tab => tab.id === tabId)
        if(!visibleTab)
            return;

        this._selectedTab = tabId;

        // hide all the other tabs
        this._tabs.forEach(tab => this._setTabVisibility(tab, false));

        // show the target one
        this._setTabVisibility(visibleTab, true)

        this._renderTabs();
    }

    onTabClick(tab){
        this.selectTab(tab.id)

    }

    _setTabVisibility(tab, visible){
        tab.content.style.display = visible ? '' : 'none';
    }
}
customElements.define('ir-tabbed', TabbedView);

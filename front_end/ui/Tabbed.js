class TabbedView extends HTMLElement{

    constructor(){
        super();
        this.$ = this.attachShadow({mode: 'open'});
        
        this.$.innerHTML = `
            <header>
                <ol id="tabs-header-list"></ol>
            </header>
            <section id="tab-content">
                
            </section> 
        `;

        this.tabHeaderList = this.$.querySelector('#tabs-header-list');
        this.tabContent = this.$.querySelector('#tab-content');
    }

    connectedCallback(){
        console.log('this.tabHeaderList')
    }
}
console.log('asdasd')
customElements.define('ir-tabbed', TabbedView);
document.body.innerHTML = '<ir-tabbed></ir-tabbed>'
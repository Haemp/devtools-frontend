/**
 * @class
 * @name Dialog.Dialog
 * @extends HTMLElement
 */
class Dialog extends HTMLElement{

    constructor(){
        super();

        this.$ = this.attachShadow({mode: 'open'})
        this.$.innerHTML = `
            <style>
                :host{
                    display:block;
                }
                header{ 
                    margin-bottom: 5px;
                    text-transform: uppercase;

                }
                .file-path{
                    width: 100%;
                    padding: 5px 5px;
                    font-size: 15px;
                }
                .content{
                    margin-bottom: 5px;
                }
                footer{
                    display:flex;
                }
                .btn-container{
                    margin-left: auto
                }
                .btn{
                    padding: 4px 7px
                }
                .wrapper.modal{
                    position:absolute;
                    left: 0;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    display:flex;
                    align-items: center;
                    justify-content: center;
                }
                .inner-wrapper{
                    min-width: 300px;
                    max-width: 600px;
                    padding: 10px;
                    box-shadow: 0px 1px 3px rgba(0,0,0,0.4)
                }
            </style>
            <div class="wrapper">
                <div class="inner-wrapper">
                    <header></header>
                    <div class="content">
                        <input type="text" class="file-path">
                    </div>
                    <footer>
                        <div class="btn-container">
                            <button class="btn _save">Save</button>
                            <button class="btn _cancel">Cancel</button>
                        </div>
                    </footer>
                </div>
            </div>
        `;

        this.header = this.$.querySelector('header');
        this.content = this.$.querySelector('.content');
        this.wrapper = this.$.querySelector('.wrapper');

        this.saveBtn = this.$.querySelector('.btn._save');
        this.cancelBtn = this.$.querySelector('.btn._cancel');
        this.filePathInput = this.$.querySelector('.file-path');

        this.filePathInput.addEventListener('keyup', e => {
            this._path = this.filePathInput.value;
        })

        this.saveBtn.addEventListener('click', _ => {
            const evt = new Event('save')
            evt.data = this._path;
            this.dispatchEvent(evt)
        })

        this.cancelBtn.addEventListener('click', _ => {
            const evt = new Event('cancel')
            this.dispatchEvent(evt)
        })

        this._path = ''
        this._title = 'Create'
    }

    connectedCallback(){

        this._render();
    }

    setModal(isModal){
        this._isModal = isModal;
    }

    set title(title){
        this._title = title;
        this._render();
    }

    set path(path){
        this._path = path;
        this._render()
    }

    _render(){
        this.filePathInput.value = this._path || '';
        this.header.innerText = this._title || '';

        if(this._isModal){
            this.wrapper.classList.add('modal')
        }else{
            this.wrapper.classList.remove('modal')
        }
    }

}

customElements.define('i-dialog', Dialog)

Dialog.Dialog = Dialog;

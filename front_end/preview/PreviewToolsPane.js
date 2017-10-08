
Preview.PreviewToolsPane = class PreviewToolsPane extends UI.TabbedPane{

  constructor(){
    super();
    // create the inspector panel
    this._inspectorPanel = new Elements.ElementsPanel();
    this.appendTab('inspector', 'Inspector', this._inspectorPanel);


    document.addEventListener('projectchange', () => {
      // clean up all editors
      this._editors.keysArray().forEach((sourceName) => {
          this.closeTab(sourceName);
      })
    })

    /**
     * @type {Map<String, SourceFrame.UISourceCodeFrame>}
     */
    this._editors = new Map();
    Preview.PreviewModel.addEventListener('previewran', (runSettings) => {
      runSettings.data.settings.uiSourceCodes()
        .filter(uiSourceCode => uiSourceCode.displayName() !== 'bundle.js')
        .forEach( /** @type {Workspace.UISourceCode} */ (uiSourceCode) => {

          // clean up old tab
          this.closeTab(uiSourceCode.displayName(), false)

          // create new one
          const source = new Sources.JavaScriptSourceFrame(uiSourceCode);
          source.setHighlighterType(uiSourceCode.mimeType());

          // add tab editor pane
          this.appendTab(uiSourceCode.displayName(), uiSourceCode.displayName(), source)

          // store the editor in a list
          this._editors.set(uiSourceCode.displayName(), source)
        })
    })

    // check for cmd+s events then we check if any of our editors has focus
    // in which case we trigger a commitEditing() on that editor
    document.addEventListener('keydown', /** @type {KeyboardEvent}*/ (keyDownEvent) => {
      if(keyDownEvent.key === "s" && keyDownEvent.metaKey){
        // check if any of the editors have focus
        /** @type {SourceFrame.UISourceCodeFrame} */
        const focusedEditor = this._editors.valuesArray().find(editor => editor.textEditor.codeMirror().hasFocus())
        if(focusedEditor){
          focusedEditor.commitEditing()
        }
      }
    }, {capture: true})
  }
}




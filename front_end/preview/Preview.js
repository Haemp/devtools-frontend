
if(typeof Preview === "undefined"){
  Preview = {}
}else{
  /** @global  */
  Preview = Preview;
}

/**
 * @typedef {{
 *  startup: String,
 *  sandbox: String
 *  settings: String,
 *  ironFolder: String
 * }} IronSettings
 */

/**
 * @description
 * @property {Persistence.IsolatedFileSystem} _entryFileFileSystem
 */
class PreviewModel extends Common.Object{

  constructor(){
    super()

    this._activePreviewSettings = {};
  }

  _assignBinding(event){
    const networkSourceCode = event.data;

    // add binding for the main entry file
    if(networkSourceCode.name() === this._activeUiSourceCode.name()
       && networkSourceCode.origin().includes('webpack://')
       && !Persistence.fileSystemMapping.hasMappingForNetworkURL(networkSourceCode.url())
    ){
      const baseEntryFileSystemPath = Persistence.FileSystemWorkspaceBinding.fileSystemPath(this._activeUiSourceCode.project().id())
      Persistence.fileSystemMapping.addMappingForResource(
        networkSourceCode.url(),
        baseEntryFileSystemPath,
        this._activeUiSourceCode.url()
      )
    }

    // attempt to bind any source file that is being pulled in from the localhost:8081 domain
    // to any file directly in root of the entryfile folder
    if(networkSourceCode.origin().includes('localhost:8081')){

      console.log('PreviewModel: Network Resource', networkSourceCode)

      // get parent project for the selected entryFile
      const parentProject = this._activeUiSourceCode.project();

      // check if there are any files in the parent project
      // with the same name as the ones pulled in from
      // the network
      const foundMatchUiSource = parentProject.uiSourceCodes().find((uiSource) => {
        return uiSource.name() === networkSourceCode.name()
      })

      if(foundMatchUiSource && !Persistence.fileSystemMapping.hasMappingForNetworkURL(foundMatchUiSource.url())){
        console.log('PreviewModel: Binding ', networkSourceCode, ' to ', foundMatchUiSource)
        Persistence.fileSystemMapping.addMappingForResource(
          networkSourceCode.url(),
          Persistence.FileSystemWorkspaceBinding.fileSystemPath(foundMatchUiSource.project().id()),
          foundMatchUiSource.url()
        )
      }
    }
  }

  /**
   *
   * @param {Workspace.UISourceCode} uiSourceCode
   * @returns {Promise<IronSettings>}
   */
  async runFile(uiSourceCode){
    const filePath = uiSourceCode.contentURL().replace('file://', '')
    this._activeUiSourceCode = uiSourceCode;

    Workspace.workspace.removeEventListener(Workspace.Workspace.Events.UISourceCodeAdded, this._assignBinding, this);
    Workspace.workspace.addEventListener(Workspace.Workspace.Events.UISourceCodeAdded, this._assignBinding, this);

    // sets the active file and in return we get
    // a formated filesystem to be added
    const settingsFilesystem = await Preview.ElectronFileSystemBackend.runFile(filePath)
    console.log('Settings file system', settingsFilesystem);

    // clean up old iron folder filesystems
    if(this._entryFileFileSystem)
      Persistence.isolatedFileSystemManager.removeFileSystem(this._entryFileFileSystem)

    // find the project listing source maps - this is the one
    // that will contain the uiSourceCode for the compiled files
    // const networkProject = Workspace.workspace.projects().filter((project) => {
    //   return project._id === 'jsSourceMaps::main';
    // }).pop()

    // Add the filesystem - this will trigger all the panels to update to show the new
    // filesystem
    this._entryFileFileSystem = await Persistence.isolatedFileSystemManager._innerAddFileSystem(settingsFilesystem, true)
    console.log('PreviewModel: Added settings filesystem', this._entryFileFileSystem)

    const settingsFs = Workspace.workspace._projects.get(this._entryFileFileSystem.path())
    this.activePreview = {
      entryFile: uiSourceCode,
      settings: settingsFs
    }

    this.dispatchEventToListeners('previewran', this.activePreview)
  }

}

/** lets make this a singleton */
Preview.PreviewModel = new PreviewModel();

/**
 * - We need to listen for change events
 *
 * @type {Preview}
 */
Preview.PreviewSandbox = class extends UI.Widget {

  constructor(){
    super(true);
    console.log('Instantiating Sources.Preview');

    this.contentElement.innerHTML = `
        <webview allowpopups 
                 disablewebsecurity 
                 style="position: absolute; width: 100%; height: 100%"
                 disableblinkfeatures="ReportingObserver"
                 src="http://localhost:8081"></webview>`;
    this.$ = {
      container: this.contentElement.querySelector('webview')
    };

    console.log('Attaching listener to ', document);
    document.addEventListener('sourcechange', (evt) => {
      console.log('Refreshing source');
      this.refresh();
    });

    document.addEventListener('builderror', (e) => {
      Common.console.addMessage(e.data, Common.Console.MessageLevel.Error)
    })

    document.addEventListener('keydown', (event) => {
      console.log('PreviewSandbox: Capturing refresh event')
      if(event.key === 'r' && event.metaKey){
        event.preventDefault();
        event.stopImmediatePropagation()
        //Preview.PreviewModel.runFile(Preview.PreviewModel._activeUiSourceCode)
        this.refresh();
      }
    }, {capture: true})
  }

  /**
   * Clears all the data from the iframe leaving it blank
   */
  refresh() {
    console.log('Refresh triggered');
    setTimeout(() => {
      this.$.container.reload();
    }, 2000)
  }
};


/**
 * @description
 * What the hell does this thing do?
 * - Applies breakpoints for scripts being loaded in
 * - Resumes
 */
class Interceptor{

  constructor(){

    Promise.all([
      this.getDebuggerModel(),
      this.getDOMDebuggerModel()
    ]).then((models) => {
      const [debuggerModel, domDebuggerModel] = models;

      // setup stop on first line
      const scriptProcessing = [];
      domDebuggerModel._agent.setInstrumentationBreakpoint("scriptFirstStatement");
      SDK.targetManager.addModelListener(SDK.DebuggerModel, SDK.DebuggerModel.Events.DebuggerPaused, async (event) => {

        // data associated to the pause is located in
        // the debuggerModel
        /** @type {SDK.DebuggerModel} */
        const debuggerModel = event.data;
        const details = debuggerModel.debuggerPausedDetails();

        // first check if this is a legit first script breakpoint
        if(details.reason !== "EventListener"){
          return // IT IS! Better gtfo out of here and let it do its thing.
        }

        this.breakpointSettingMode = true;

        // now we figure out what script this BP has hit
        const script = details.callFrames[0].script;

        console.log('Interceptor: Waiting for script', script.sourceURL, ' ...');
        await script.allUISourceCodeLoadedPromise;
        console.log('Interceptor: Script Processed: ', script.sourceURL);

        // get the main sourcecode for the script
        const mainUISourceCode = script[Bindings.DefaultScriptMapping._uiSourceCodeSymbol];

        // If there are SourceMaps we will also have those files associated with the script
        const sourceMappedUISourceCodes = script.associatedUISourceCodes.valuesArray();

        const uiSourceCodes = sourceMappedUISourceCodes.concat(mainUISourceCode);
        await Promise.all(uiSourceCodes.map(uiSourceCode => uiSourceCode.breakpointsHasBeenInitiatedPromise))

        script.allInitialBreakpointsSet = true;

        this.breakpointSettingMode = false;

        // Everything is resolved - we can now resume the debugger for
        // the next script in line
        debuggerModel.resume();
      })
    });
  }

  getDebuggerModel(){
    return new Promise((res, rej) => {
      SDK.targetManager.observeModels(SDK.DebuggerModel, {
        modelAdded: (model) => {
          res(model)
        }
      });
    })
  }

  getDOMDebuggerModel(){
    return new Promise((res, rej) => {
      SDK.targetManager.observeModels(SDK.DOMDebuggerModel, {
        modelAdded: (model) => {
          res(model)
        }
      });
    })
  }


  // Case: we have a bundle file without a breakpoint.
  // really what we need is to wait until the UISourceCode has been processed

  // Case: We refresh a file - we will eventually have a state where the debugger file
  // has a breakpoint via setByUrl.
  // Solution: We need to make sure that these are cleaned out properly.

  // we wait till we know the breakpoints have been
  // applied, and then resume.
  // this._breakpointManager.once(Bindings.BreakpointManager.Events.BreakpointsApplied).then( /** @param Workspace.UISourceCode uiSourceCode */(uiSourceCode) => {
  //
  //   console.log('Interceptor: Breakpoint for processed. Scope: ', scriptUrl, ', UISourceCode: ', uiSourceCode.url());
  //   if(uiSourceCode.url().includes(scriptUrl)){
  //     console.log('Interceptor: Debugger resumed');
  //     this._debuggerModel.resume();
  //   }
  // });

}

Preview.interceptor = new Interceptor();

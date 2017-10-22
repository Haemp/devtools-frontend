class Interceptor{

  constructor(){

    // we need to get ahold of the dbugger
    // target first of all
    // SDK.targetManager.addEventListener(
    //   SDK.TargetManager.Events.InspectedURLChanged, this._inspectedURLChanged, this
    // );
  }

  _inspectedURLChanged(event){

    console.log('Interceptor: Inspect URL Changed', event.data);
    if(!event.data.inspectedURL().includes('http://localhost:8081'))
      return;

    this._target = event.data;
    this._breakpointManager = Bindings.breakpointManager;
    this._debuggerModel = this._target.model(SDK.DebuggerModel);
    this._workspace = this._breakpointManager._workspace;
    // when a source mapp attaches - we
    //this._debuggerModel.sourceMapManager().addEventListener(SDK.SourceMapManager.Events.SourceMapAttached, /** @param {{data: {SDK.Script}}} event */(event) => {
    this._workspace.addEventListener(Workspace.Workspace.Events.UISourceCodeAdded, async (event) => {

      // we pause the debugger to set the breakpoints
      // before the execution of the script
      /** @type Workspace.UISourceCode */
      const uiSourceCode = event.data;

      console.log('Interceptor: Pausing debugger for script: ', uiSourceCode.url(), ', Pausing.');
      this._debuggerModel.pause();
      await uiSourceCode.breakpointsHasBeenResolved;
      this._debuggerModel.resume();
      console.log('Interceptor: All breakpoints resolved: ', uiSourceCode.url(), ', Resuming.');

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

    });
  }

  _inspectedURLChanged2(event){
    console.log('Interceptor: Inspect URL Changed', event.data);
    if(!event.data.inspectedURL().includes('http://localhost:8081'))
      return;

    this._target = event.data;
    this._breakpointManager = Bindings.breakpointManager;

    // we now have the debugger target, now we
    // start listening to the debugger model for new
    // files.
    this._debuggerModel = this._target.model(SDK.DebuggerModel);
    this._debuggerModel.addEventListener(SDK.DebuggerModel.Events.ParsedScriptSource, /** @param {{data: {SDK.Script}}} event */(event) => {
      const scriptUrl = event.data.sourceURL;

      // we pause the debugger to set the breakpoints
      // before the execution of the script
      console.log('Interceptor: Pausing debugger for script', scriptUrl);
      this._debuggerModel.pause();

      // Case: we have a bundle file without a breakpoint.
      // really what we need is to wait until the UISourceCode has been processed

      // Case: We refresh a file - we will eventually have a state where the debugger file
      // has a breakpoint via setByUrl.
      // Solution: We need to make sure that these are cleaned out properly.

      // we wait till we know the breakpoints have been
      // applied, and then resume.
      this._breakpointManager.once(Bindings.BreakpointManager.Events.BreakpointsApplied).then( /** @param Workspace.UISourceCode uiSourceCode */(uiSourceCode) => {

        console.log('Interceptor: Breakpoint for processed. Scope: ', scriptUrl, ', UISourceCode: ', uiSourceCode.url());
        if(uiSourceCode.url().includes(scriptUrl)){
          console.log('Interceptor: Debugger resumed');
          this._debuggerModel.resume();
        }
      });

    });
  }
}

Preview.Interceptor = new Interceptor();

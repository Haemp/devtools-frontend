class ProjectModel extends HTMLElement{
  constructor(){
    super()
    this.activeProject = null;
  }

  /**
   *
   * @param {Persistence.IsolatedFileSystemManager.FileSystem} project
   * @returns {Promise.<void>}
   */
  async setActiveProject(project){

    if(this.activeProject)
      Persistence.isolatedFileSystemManager.removeFileSystemByName(this.activeProject.rootUrl);

    await Preview.ElectronFileSystemBackend.selectProject(project)
    this.activeProject = project;

    this.dispatchEvent(new Event('change'))
  }

  getActiveProject(){
    return this.activeProject;
  }
}

customElements.define('ir-project-model', ProjectModel);
Project.ProjectModel = new ProjectModel();

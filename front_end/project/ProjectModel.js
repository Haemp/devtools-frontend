const BACKEND_HOST = 'http://localhost:1234';

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

    if(project)
      await this._selectProject(project)

    this.activeProject = project;
    this.dispatchEvent(new Event('change'))
  }

  getActiveProject(){
    return this.activeProject;
  }

  /**
   * @return {Promise<BackendFileSystemEntry[]>}
   */
  getFileSystems(){
    return fetch(BACKEND_HOST + '/filesystems').then(
      /**
       * @param {Response} response
       **/
      (response) => response.json()
    )
  }

  _selectProject(project){
    return fetch(BACKEND_HOST + '/project/active?projectPath='+project.fileSystemPath, {
      method: 'PUT'
    })
  }
}

customElements.define('ir-project-model', ProjectModel);
if(typeof Project === 'undefined') Project = {};
Project.ProjectModel = new ProjectModel();

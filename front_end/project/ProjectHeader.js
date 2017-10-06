/**
 * @dependency Project.ProjectModel
 */

/**
 * @class ProjectHeader
 * @property {Persistence.IsolatedFileSystemManager.FileSystem} activeProject
 */
class ProjectHeader extends Simply.Component{

  static get template(){
    return `
      <style>
         :host{
            display:flex;
         }
         button{
            margin-left: auto;
         }
      </style>
      <div if="this.activeProject">{{ this._formatedActiveProject() }}</div>
      <div if="!this.activeProject">No Active Project</div>
      <button if="this.activeProject" (click)="this.switchView()">change</button>
    `;
  }

  static get props(){
    return ['activeProject']
  }

  _formatedActiveProject(){
    return this.activeProject.fileSystemName;
  }

  connectedCallback(){
    Project.ProjectModel.addEventListener('change', () => {
        /** @type {Persistence.IsolatedFileSystemManager.FileSystem} */
        this.activeProject = Project.ProjectModel.activeProject;
    })
  }

  switchView(){
    Project.ProjectModel.setActiveProject(null);
  }
}
ProjectHeader.define('ir-project-header')

Project.ProjectHeader = ProjectHeader;

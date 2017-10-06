/** @global */
Project = (Project);


/**
 * @dependency Project.ProjectModel
 */

class ProjectSelect extends Simply.Component{
    static get template(){
        return `
            <style>
              :host{
                  --bg-color: #ccc;
                  font-family: Roboto, sans-serif;
                  font-size: 16px;
              }
              .outer-container{
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  z-index: 99;
                  background-color: var(--bg-color);
              }
              li, ul{ list-style:none; margin:0; padding: 0;}
              li{ 
                padding: 10px 20px; 
                cursor:pointer;
              }
              li:hover{
                  background-color: #ddd;
              }
              button{
                  width: 400px;
                  box-sizing: border-box;
                  border: 0;
                  font-family: Roboto, sans-serif;
                  padding: 10px 20px;
                  border-radius: 20px;
                  border: 2px solid #999;
                  outline: none;
                  color: #999;
                  background-color: transparent;
                  cursor:pointer;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  font-weight: bold;
                  color: #666
              }
              button:hover{
                  background-color: #eee;
                  color: #333;
              }
              .previous-projects{
                  max-width: 400px;
                  margin: 0 auto;
              }
              .btn-wrapper{
                  margin-top: 20px;
                  text-align:center;
              }
            </style>
            <div class="outer-container" show="!this.activeProject">
                <div class="inner-container">
                    <ul class="previous-projects">
                        <li (click)="this.selectProject(project)" each="project in this.previousProjects">
                          {{ project.fileSystemPath }}
                        </li>
                        
                    </ul>
                    <div class="btn-wrapper">
                        <button (click)="this.createNewProject()">
                            Create new Project
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    static get props(){
        return [
            'previousProjects',
            'activeProject'
        ]
    }

    async connectedCallback(){

        Project.ProjectModel.addEventListener('change', () => {
            this.activeProject = Project.ProjectModel.getActiveProject();
        })

        this.previousProjects = await Project.ProjectModel.getFileSystems()
    }

    /**
     * Trigger the dialog and select that folder as a project
     */
    async createNewProject(){

        // show dialog window
        const fileSystem = await Preview.ElectronBackground.showFolderSelectionDialog()

        // set project based on the folder selected
        return this.selectProject(fileSystem)
    }

    /**
     * We trigger a global event on project select.
     * That the preview module will listen for
     * and trigger the addWorkspace function
     *
     * @param {Persistence.IsolatedFileSystemManager.FileSystem} project
     */
    async selectProject(project){

        Project.ProjectModel.setActiveProject(project);
        Persistence.isolatedFileSystemManager.addFileSystemByFileSystem(project)
    }
}


ProjectSelect.define('ir-project-select')




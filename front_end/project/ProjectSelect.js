/** @global */
Project = (Project);


/**
 * @dependency Project.ProjectModel
 */

class ProjectSelect extends Simply.Component{
    static get template(){
        return `
            <style>
              .container{
                  display: block;
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  z-index: 99;
                  background-color: #ccc;
              }
            </style>
            <div class="container" show="!this.activeProject">
              <ul>
                <li (click)="this.selectProject(project)" each="project in this.previousProjects">
                  {{ project.fileSystemPath }}
                </li>
                <li (click)="this.createNewProject()">Create new Project</li>
              </ul>
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

        this.previousProjects = await Preview.ElectronFileSystemBackend.getFileSystems()
    }

    /**
     * Trigger the dialog and select that folder as a project
     */
    async createNewProject(){

        // show dialog window
        const fileSystem = await Preview.ElectronBackground.showFolderSelectionDialog()

        // set project based on the folder selected
        return this.selectProject(Preview.Utils.formatPathAsFileSystem(fileSystem.fileSystemPath))
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

        // hide the project view

        Persistence.isolatedFileSystemManager.addFileSystemByPath(project)
    }
}


ProjectSelect.define('ir-project-select')




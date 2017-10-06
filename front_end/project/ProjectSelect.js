class ProjectSelect extends Simply.Component{
    static get template(){
        return `
            <style>
                :host{
                    display: block;
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    z-index: 99;
                    background-color: #ccc;
                }
            </style>
            <ul>
                <li (click)="this.selectProject(project)" each="project in this.previousProjects">
                    {{ project.fileSystemPath }}
                </li>
                <li (click)="this.createNewProject()">Create new Project</li>
            </ul>
        `
    }

    static get props(){
        return [
            'previousProjects'
        ]
    }

    async connectedCallback(){

        const previousProjects = await Preview.ElectronFileSystemBackend.getFileSystems()
        this.previousProjects = previousProjects;
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

        await Preview.ElectronFileSystemBackend.selectProject(project)
        const event = new Event('projectselect')
        event.data = project;
        document.dispatchEvent(event);

        // hide the project view
        this.hide();
        Persistence.isolatedFileSystemManager.addFileSystemByPath(project)
    }

    hide(){
      this.style.display = 'none';
    }
}


ProjectSelect.define('ir-project-select')




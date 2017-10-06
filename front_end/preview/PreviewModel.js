
if(typeof Preview === "undefined"){
  /** @global  */
  window.Preview = {}
}else{
  /** @global  */
  window.Preview = Preview;
}

/**
 * @type {Preview.ElectronFileSystemBackend}
 */
const BACKEND_HOST = 'http://localhost:1234';
class ElectronFileSystemBackend {

  /**
   * @return {Promise<BackendFileSystemEntry[]>}
   */
  getFlatFileListing(absolutePath){
    return fetch(BACKEND_HOST + '/entries?rootPath='+absolutePath).then((response) => {
      return response.json()
    })
  }

  /**
   * Fetching metadata and converting the modification time from string to Date. Other than
   * that nothing interesting going on here.
   * @param filePath
   */
  getFileMetaData(filePath){
    return fetch(BACKEND_HOST + '/file/meta-data?filePath='+filePath)
      .then(res => res.json())
      .then(/** @param {FileMetaData} metaData */(metaData) => {
      metaData.modificationTime = new Date(metaData.modificationTime);
      return metaData;
    })
  }

  /**
   * Sets the target file as the new active definition
   * @param {String} absoluteFilePath - absolute filepath
   * @returns {Promise<Persistence.IsolatedFileSystemManager.FileSystem>}
   */
  runFile(absoluteFilePath){

    console.log('Running file', absoluteFilePath)
    return fetch(BACKEND_HOST + '/run?absoluteFilePath='+absoluteFilePath, {
      method: 'PUT'
    }).then(res => res.json())
  }

  /**
   * @param {String} folder
   * @param {String} name
   * @param {String} content
   * @returns {Promise<String>} resolving in the path of the new file
   */
  createFile(projectPath, filePath){


    return fetch(BACKEND_HOST + `/file?filePath=${projectPath + '/' + filePath}`, {method: 'POST'})
      .then((res) => {
          if(res.status === 200){
            return res.json().then(fileData => { fileData.filePath = filePath; return fileData});
          }else{
            return Promise.reject(res.json())
          }
      })
  }

  /**
   * @param {String} path - path from the root filesystem, prepended slash
   * eg: /somefolder/somefile.js
   *
   * @return Promise<String>
   */
  getFileContents(path){
    return fetch(BACKEND_HOST + '/file?filePath='+path).then(res => res.text());
  }


  /**
   * @param filePath
   * @param contents
   * @returns {Promise}
   */
  setFileContents(filePath, contents){
    return fetch(BACKEND_HOST + '/file?filePath='+filePath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents
      })
    })
  }

  /**
   *
   * @param folderPath
   */
  createFolder(folderPath){
    return fetch(BACKEND_HOST + '/folder?folderPath='+folderPath, {method: 'POST'}).then((res) => {
      if(res.status === 200){
        return res.json();
      }else{
        return Promise.reject(res.json())
      }
    })
  }

  /**
   *
   * @param {String} filePath
   * @param {String} newName
   */
  renameFile(filePath, newName){
    return fetch(BACKEND_HOST + '/file-name?filePath='+filePath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newName: newName
      })
    }).then((res) => {
        if(res.status === 200){
          return res.json();
        }else{
          return Promise.reject(res.json())
        }
    })
  }


}

Preview.ElectronFileSystemBackend = new ElectronFileSystemBackend()

Preview.Utils = {

  /**
   * @param path
   * @param name
   * @returns {Persistence.IsolatedFileSystemManager.FileSystem}
   */
  formatPathAsFileSystem(path, name){
    return {
      fileSystemName: name || 'defaultFileSystem',
      fileSystemPath: path,
      rootUrl: 'file://' + path
    }
  }
}


class ElectronBackground{
  /**
   * @return Promise<Persistence.IsolatedFileSystemManager.FileSystem>
   */
  showFolderSelectionDialog(){
    return fetch(BACKEND_HOST + '/select-folder').then((res) => {

      return res.json()
    }).then(/** @type Persistence.IsolatedFileSystemManager.FileSystem */(fileSystem) => {
        return fileSystem
    });
  }
}

Preview.ElectronBackground = new ElectronBackground();

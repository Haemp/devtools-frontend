/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @unrestricted
 */
Persistence.IsolatedFileSystem = class {
  /**
   * @param {!Persistence.IsolatedFileSystemManager} manager
   * @param {string} path
   * @param {string} embedderPath
   */
  constructor(manager, path, embedderPath) {
    this._manager = manager;
    this._path = path;
    this._embedderPath = embedderPath;
    this._excludedFoldersSetting = Common.settings.createLocalSetting('workspaceExcludedFolders', {});
    /** @type {!Set<string>} */
    this._excludedFolders = new Set(this._excludedFoldersSetting.get()[path] || []);

    /** @type {!Set<string>} */
    this._initialFilePaths = new Set();
    /** @type {!Set<string>} */
    this._initialGitFolders = new Set();
  }

  /**
   * @param {!Persistence.IsolatedFileSystemManager} manager
   * @param {string} path
   * @param {string} embedderPath
   * @param {string} name
   * @param {string} rootURL
   * @return {!Promise<?Persistence.IsolatedFileSystem>}
   */
  static create(manager, path, embedderPath, name, rootURL) {
    // Create filesystem stubb
    var fileSystem = new Persistence.IsolatedFileSystem(manager, path, embedderPath);

    // Populate filesystem inner values
    return fileSystem._initializeFilePaths(embedderPath)
        .then(() => fileSystem)
        .catchException(/** @type {?Persistence.IsolatedFileSystem} */ (null));
  }

  /**
   * @param {!DOMError} error
   * @return {string}
   */
  static errorMessage(error) {
    return Common.UIString('File system error: %s', error.message);
  }

  /**
   * @param {string} path
   * @return {!Promise<?{modificationTime: !Date, size: number}>}
   */
  getMetadata(path) {
    console.log('Getting metadata for', path);
    return Preview.ElectronFileSystemBackend.getFileMetaData(path);
  }

  /**
   * @return {!Array<string>}
   */
  initialFilePaths() {
    return this._initialFilePaths.valuesArray();
  }

  /**
   * @return {!Array<string>}
   */
  initialGitFolders() {
    return this._initialGitFolders.valuesArray();
  }

  /**
   * @return {string}
   */
  path() {
    return this._path;
  }

  /**
   * @return {string}
   */
  embedderPath() {
    return this._embedderPath;
  }

  /**
   * Creates a flat file tree with all the files accessible
   *
   * These paths should not have a prepended slash - just 'folder/file.js'
   * These are only a listing of file paths - no folders should be listed in the
   * _initialFilePaths list.
   *
   * @param {String} path the absolute path that we want to list the entries from.
   * @return {!Promise<String[]>}
   */
  _initializeFilePaths(absolutePath) {
    return Preview.ElectronFileSystemBackend.getFlatFileListing(absolutePath).then(/** @param {BackendFileSystemEntry[]} paths */(entries) => {
      entries.forEach(entry => {
        if (!entry.isDirectory) {
          if (!this._isFileExcluded(entry.fullPath)){
            this._initialFilePaths.add(entry.fullPath);
          }
        } else {
          if (entry.fullPath.endsWith('/.git')) {
            var lastSlash = entry.fullPath.lastIndexOf('/');
            var parentFolder = entry.fullPath.substring(1, lastSlash);
            this._initialGitFolders.add(parentFolder);
          }
        }
      })
    })
  }

  /**
   * @param {string} path
   * @param {?string} name
   * @param {function(?string)} callback
   */
  createFile(path, name, callback) {
    console.log('Creating a file', path, name);
    let relativeFilePath;
    const file = 'new-file.js';
    if(path){
      relativeFilePath = path + '/' + file;
    }else{
      relativeFilePath = file;
    }

    Preview.ElectronFileSystemBackend.createFile(this._embedderPath, relativeFilePath).then((response) => {
      callback(response.filePath);
    }).catch((err) => {
      console.error('Error creating file', err);
      callback()
    });
  }

  /**
   * @param {string} path
   */
  deleteFile(path) {

  }

  /**
   * @param {string} path - path relative to the root fileSystem - prepended slash
   * @param {function(?string)} callback
   */
  requestFileContent(path, callback) {

    Preview.ElectronFileSystemBackend.getFileContents(this._embedderPath + path).then((fileContent) => {
        callback(fileContent);
    }).catch((err) => {

      if (err.name === 'NotFoundError') {
        callback(null);
        return;
      }

      var errorMessage = Persistence.IsolatedFileSystem.errorMessage(error);
      console.error(errorMessage + ' when getting content for file \'' + (this._path + '/' + path) + '\'');
      callback(null);
    })
  }

  /**
   * @param {string} path
   * @param {string} content
   * @param {function()} callback
   */
  setFileContent(path, content, callback) {

    Preview.ElectronFileSystemBackend.setFileContents(this._embedderPath + path, content).then(() => {
        callback()
    });
  }

  /**
   * @param {string} path
   * @param {string} newName
   * @param {function(boolean, string=)} callback
   */
  renameFile(path, newName, callback) {

    Preview.ElectronFileSystemBackend
      .renameFile(this._embedderPath + path, newName)
      .then(res => callback(true, newName))
      .catch(err => callback(false))
  }

  _saveExcludedFolders() {
    var settingValue = this._excludedFoldersSetting.get();
    settingValue[this._path] = this._excludedFolders.valuesArray();
    this._excludedFoldersSetting.set(settingValue);
  }

  /**
   * @param {string} path
   */
  addExcludedFolder(path) {
    this._excludedFolders.add(path);
    this._saveExcludedFolders();
    this._manager.dispatchEventToListeners(Persistence.IsolatedFileSystemManager.Events.ExcludedFolderAdded, path);
  }

  /**
   * @param {string} path
   */
  removeExcludedFolder(path) {
    this._excludedFolders.delete(path);
    this._saveExcludedFolders();
    this._manager.dispatchEventToListeners(Persistence.IsolatedFileSystemManager.Events.ExcludedFolderRemoved, path);
  }

  fileSystemRemoved() {
    var settingValue = this._excludedFoldersSetting.get();
    delete settingValue[this._path];
    this._excludedFoldersSetting.set(settingValue);
  }

  /**
   * @param {string} folderPath
   * @return {boolean}
   */
  _isFileExcluded(folderPath) {
    if (this._excludedFolders.has(folderPath))
      return true;
    var regex = this._manager.workspaceFolderExcludePatternSetting().asRegExp();
    return !!(regex && regex.test(folderPath));
  }

  /**
   * @return {!Set<string>}
   */
  excludedFolders() {
    return this._excludedFolders;
  }

  /**
   * @param {string} query
   * @param {!Common.Progress} progress
   * @return {!Promise<!Array<string>>}
   */
  searchInPath(query, progress) {
    return new Promise(resolve => {
      var requestId = this._manager.registerCallback(innerCallback);
      InspectorFrontendHost.searchInPath(requestId, this._embedderPath, query);

      /**
       * @param {!Array<string>} files
       */
      function innerCallback(files) {
        resolve(files.map(path => Common.ParsedURL.platformPathToURL(path)));
        progress.worked(1);
      }
    });
  }

  /**
   * @param {!Common.Progress} progress
   */
  indexContent(progress) {
    progress.setTotalWork(1);
    var requestId = this._manager.registerProgress(progress);
    InspectorFrontendHost.indexPath(requestId, this._embedderPath);
  }
};

Persistence.IsolatedFileSystem.ImageExtensions =
    new Set(['jpeg', 'jpg', 'svg', 'gif', 'webp', 'png', 'ico', 'tiff', 'tif', 'bmp']);

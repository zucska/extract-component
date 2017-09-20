const vscode = require('vscode');

const fs = require('fs');
const mkdirp = require('mkdirp');
const { dirname } = require('path')

const _ = require('lodash');


const createFile = (name, contents, original, cb) => {

    const pathFolder = settings.componentsFolderPath
    const path = vscode.workspace.rootPath + pathFolder + name + '/index.js'
    const pathPackage = vscode.workspace.rootPath + pathFolder + 'package.json'

    if (fs.existsSync(path))
        return cb('File exist')

    readTemplate(function (template) {
        const props = ['', ''] //createProps(contents)
        
        let newContent = template.replace(new RegExp('__COMPONENTNAME__', 'g'), capitalizedCamelCase(name))
        newContent = newContent.replace("__CONTENTS__", contents)
        newContent = newContent.replace("__PROPS__", props[0])

        // se il file contiene react-native clono anche la riga
        newContent = newContent.replace("__IMPORT__", generateImport(original))

        mkdirp(dirname(path), function (err) {
            if (err) return cb(err);

            // create package @components
            if (!fs.existsSync(pathPackage))
                createPackage(pathPackage)

            fs.writeFile(path, newContent, () => {
                cb(null)
            });
        });

    })

}

const capitalizedCamelCase = (e) => {
    return _.capitalize(_.camelCase(e))
}

const createPackage = (folder) => {

    const name = getNameComponents(folder)
    const newContent = `{
        "name" : "@${name}"
        }`

    fs.writeFile(folder, newContent, () => { });
}

const getNameComponents = (params) => {
    return _.takeRight(params.split('/'), 2)[0] || 'components'
}

const generateImport = (str) => {
    const regex = /import (.*) from 'react-native'/g;
    let m;
    let result = '';
    while ((m = regex.exec(str)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        m.forEach((match, groupIndex) => {
            if (groupIndex == 0)
                result = result + match + "\n";
        });
    }
    return result
}

const readTemplate = (cb) => {
    //TODO Version template for reactjs and reac- native
    fs.readFile(settings.extensionPath + '/assets/template.js', "utf-8", function read(err, data) {
        if (err) {
            throw err;
        }
        cb(data.toString())
    });

}


const editorContext = (callback) => {

    var editor = vscode.window.activeTextEditor;

    if (editor) {
        var selection = editor.selection;
        var original = editor.document.getText()
        var text = editor.document.getText(selection);

        callback(editor, selection, original, text)
    }

}

const settings = {
    extensionPath: vscode.extensions.getExtension('zucska.extractcomponent').extensionPath,
    componentsFolderPath: vscode.workspace.getConfiguration('extractcomponent').path,
    componentsFolderLastPath: getNameComponents(vscode.workspace.getConfiguration('extractcomponent').path),
}

exports.settings = settings;

exports.createFile = createFile;
exports.editorContext = editorContext;
exports.capitalizedCamelCase = capitalizedCamelCase;

const vscode = require('vscode');

const _ = require('lodash');
const fs = require('fs');
const mkdirp = require('mkdirp');

const { dirname } = require('path');


const noop = () => {}

const createPackage = (folder) => {
    const name = lastPathComponent(folder);
    const newContent = `{\n\t"name" : "@${name}"\n}`;
    fs.writeFile(folder, newContent, noop);
}

const lastPathComponent = (params) => {
    return _.takeRight(params.split('/'))[0] || 'components';
}

const generateImport = (str) => {
    let m, result = '';
    const regex = /import (.*) from 'react-native'/g;
    while ((m = regex.exec(str)) !== null) {
        if (m.index === regex.lastIndex)
            regex.lastIndex++;
        m.forEach((match, groupIndex) => {
            if (groupIndex == 0)
                result = result + match + "\n";
        });
    }
    return result;
}


const capitalizedCamelCase = (e) => {
    return _.capitalize(_.camelCase(e))
}


const createFile = (name, contents, original, callback) => {
    const rootPath = vscode.workspace.rootPath;
    const folderPath = settings.componentsFolderPath;
    const filePath = `${rootPath}${folderPath}${name}/index.js`;
    const packagePath = `${rootPath}${folderPath}package.json`;

    if (fs.existsSync(filePath)) return callback('File exists');

    fs.readFile(`${settings.extensionPath}/assets/template.js`, 'utf-8', (err, data) => {
        let contents = data.toString();
        contents = contents.replace(new RegExp('__COMPONENTNAME__', 'g'), capitalizedCamelCase(name));
        contents = contents.replace("__CONTENTS__", contents);
        contents = contents.replace("__IMPORT__", generateImport(original));

        mkdirp(dirname(filePath), err => {
            if (err) return callback(err);

            if (!fs.existsSync(packagePath))
                createPackage(packagePath);

            fs.writeFile(filePath, contents, callback);
        });
    });
}


const editorContext = (callback) => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selection = editor.selection;
        const original = editor.document.getText();
        const text = editor.document.getText(selection);

        return callback(editor, selection, original, text);
    }
};


const settings = {
    extensionPath: vscode.extensions.getExtension('zucska.extractcomponent').extensionPath,
    componentsFolderPath: vscode.workspace.getConfiguration('extractcomponent').path,
    componentsFolderLastPath: lastPathComponent(vscode.workspace.getConfiguration('extractcomponent').path)
};


exports.settings = settings;
exports.capitalizedCamelCase = capitalizedCamelCase;

exports.createFile = createFile;
exports.editorContext = editorContext;

const vscode = require('vscode');

const fs = require('fs');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const { dirname } = require('path');


const noop = () => {}

const createPackage = (folder) => {
    const package = `{\n\t"name" : "@${lastPathComponent(folder)}"\n}`;
    fs.writeFile(folder, package, noop);
}

const lastPathComponent = (path) => {
    return _.takeRight(path.split('/'))[0] || 'components';
}

const generateImport = (text, selection) => {
    const regex = /import(?:[\W])*?\{([^}]*?)\}(?:[\W])*?from.*'react-native'/gm;
    return text.match(regex).join('\n')
}


const capitalizedCamelCase = (text) => {
    return _.capitalize(_.camelCase(text))
}


const createFile = (name, contents, original, callback) => {
    const rootPath = vscode.workspace.rootPath;
    const folderPath = settings.componentsFolderPath;
    const filePath = `${rootPath}${folderPath}${name}/index.js`;
    const packagePath = `${rootPath}${folderPath}package.json`;

    if (fs.existsSync(filePath)) return callback('File exists');

    fs.readFile(`${settings.extensionPath}/assets/template.js`, 'utf-8', (err, data) => {
        let componentContents = data.toString();
        componentContents = componentContents.replace(new RegExp('__COMPONENTNAME__', 'g'), capitalizedCamelCase(name));
        componentContents = componentContents.replace("__CONTENTS__", contents);
        componentContents = componentContents.replace("__IMPORT__", generateImport(original, contents));

        mkdirp(dirname(filePath), err => {
            if (err) return callback(err);

            if (!fs.existsSync(packagePath))
                createPackage(packagePath);

            fs.writeFile(filePath, componentContents, callback);
        });
    });
};


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

const vscode = require('vscode');

const fs = require('fs');
const mkdirp = require('mkdirp');
const { dirname } = require('path')

const _ = require('lodash');
const lineColumn = require("line-column");


const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const createFile = (name, contents, original, cb) => {

    console.log('createFile');

    const pathFolder = vscode.workspace.getConfiguration('extractcomponent').path
    const path = vscode.workspace.rootPath + pathFolder + name + '/index.js'
    const pathPackage = vscode.workspace.rootPath + pathFolder + 'package.json'

    if (fs.existsSync(path))
        return cb('File exist')

    readTemplate(function (template) {
        const props = ['', ''] //createProps(contents)

        let newContent = template.replace(new RegExp('__COMPONENTNAME__', 'g'), capitalizeFirstLetter(_.camelCase(name)))
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
                cb(null, props[1])
            });
        });

    })

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
    const ext = vscode.extensions.getExtension('zucska.extractcomponent');
    // todo add version template for reactjs and react native
    fs.readFile(ext.extensionPath + '/assets/template.js', "utf-8", function read(err, data) {
        if (err) {
            throw err;
        }
        cb(data.toString())
    });

}



exports.createFile = createFile;
exports.readTemplate = readTemplate;
exports.createPackage = createPackage;
exports.generateImport = generateImport;
exports.getNameComponents = getNameComponents;
exports.capitalizeFirstLetter = capitalizeFirstLetter;

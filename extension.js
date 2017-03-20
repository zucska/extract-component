let vscode = require('vscode');
const fs = require('fs');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;
var _ = require('lodash');

function activate(context) {

    let disposable = vscode.commands.registerCommand('extension.extractComponent', function () {

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        var selection = editor.selection;
        var original = editor.document.getText()
        var text = editor.document.getText(selection);

        let actEdit = vscode.window.activeTextEditor;

        vscode.window.showInputBox({
            prompt: 'Insert component name',
            value: ''
        }).then(function (e) {

            if (!e || e == '') return

            createFile(e.toLowerCase(), text,original, function (err, resp) {

                if (err) {
                    vscode.window.showInformationMessage(err);
                    return
                }
                actEdit.edit(function (edit) {
                    edit.replace(selection, '<' + capitalizeFirstLetter(_.camelCase(e)) + ' ' + resp + ' />')
                })

            })
        })

    });


    let disposableEmbed = vscode.commands.registerCommand('extension.embedComponent', function () {

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        let actEdit = vscode.window.activeTextEditor;

        vscode.window.showInputBox({
            prompt: 'Insert component name',
            value: 'View'
        }).then(function (e) {

            if (!e || e == '') return

            actEdit.edit(function (edit) {
                edit.replace(selection, '<' + e + '>\n' + text + '\n</' + e + '>')
            })
        })

    });

    context.subscriptions.push(disposable)
    context.subscriptions.push(disposableEmbed)

}
exports.activate = activate;

function deactivate() {
}

function createFile(name, contents, original, cb) {

    // todo add configuration root path
    const path = vscode.workspace.rootPath + '/src/components/' + name + '/index.js'

    if (fs.existsSync(path)) {
        cb('File exist')
        return
    }

    readTemplate(function (template) {
        const props = ['', ''] //createProps(contents)

        let newContent = template.replace(new RegExp('componentName', 'g'), capitalizeFirstLetter(_.camelCase(name)))
        newContent = newContent.replace("__CONTENTS__", contents)
        newContent = newContent.replace("__PROPS__", props[0])

        // se il file contiene react-native clono anche la riga
        newContent = newContent.replace("__IMPORT__", generateImport(original))


        mkdirp(getDirName(path), function (err) {
            if (err) return cb(err);
            fs.writeFile(path, newContent, () => {
                cb(null, props[1])
            });
        });

    })

}

function generateImport(str) {
    const regex = /import (\n?\{?\n?[A-Za-z]* ?\n?\}?,?)*from 'react-native';?/g;
    let m;
    let result = '';
    while ((m = regex.exec(str)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        m.forEach((match, groupIndex) => {
            result = result+ match+"\n";
        });
    }
    return result
}

function createProps(contents) {
    const regex = /([a-zA-Z0-9-_]*)={([^0-9]*?)}/g
    let m;
    let props = ''
    let tag = ''
    while ((m = regex.exec(contents)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        m.forEach((match, groupIndex) => {
            //console.log(`Found match, group ${groupIndex}: ${match}`);
        });
        let val = m[2].replace('this.', '')
        if (m[1] != 'style') {
            props = props + `${val}, `
            tag = tag + `${val}={${val}} `
        }
    }

    props = props.slice(0, -2)
    return [props, tag]
}

function readTemplate(cb) {
    const ext = vscode.extensions.getExtension('zucska.extractcomponent');
    // todo add version template for reactjs and react native
    fs.readFile(ext.extensionPath + '/template.js', "utf-8", function read(err, data) {
        if (err) {
            throw err;
        }
        cb(data.toString())
    });

}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.deactivate = deactivate;



// prima regex 
// ([a-zA-Z0-9-_]*)={([^0-9]*?)}
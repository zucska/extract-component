let vscode = require('vscode');
const fs = require('fs');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;

function activate(context) {

    let disposable = vscode.commands.registerCommand('extension.extractComponent', function () {

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        let actEdit = vscode.window.activeTextEditor;

        vscode.window.showInputBox({
            prompt: 'nome del componente',
            value: ''
        }).then(function (e) {

            if (!e || e == '') return

            createFile(e.toLowerCase(), text, function (resp) {

                if (resp) {
                    vscode.window.showInformationMessage(resp);
                    return
                }
                actEdit.edit(function (edit) {
                    edit.replace(selection, '<' + capitalizeFirstLetter(e) + ' />')
                })

            })
        })

    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

function createFile(name, contents, cb) {

    // todo add configuration root path
    const path = vscode.workspace.rootPath + '/src/components/' + name + '/index.js'

    if (fs.existsSync(path)) {
        cb('File exist')
        return
    }

    readTemplate(function (template) {

        let newContent = template.replace(new RegExp('componentName', 'g'), capitalizeFirstLetter(name))
        newContent = newContent.replace("'__CONTENTS__'", contents)

        mkdirp(getDirName(path), function (err) {
            if (err) return cb(err);
            fs.writeFile(path, newContent, cb);
        });

    })

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
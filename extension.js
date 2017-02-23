// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
let vscode = require('vscode');
const fs = require('fs');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.extractComponent', function () {
        // The code you place here will be executed every time your command is executed

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
                console.log(resp)
                if (resp) {
                    vscode.window.showInformationMessage(resp);
                    return
                }
                actEdit.edit(function (edit) {
                    edit.replace(selection, '<' + capitalizeFirstLetter(e) + ' />\n\n {/*' + text + '*/}')
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
    const ext = vscode.extensions.getExtension('zucska.extract-component');

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
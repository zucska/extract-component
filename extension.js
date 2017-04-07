let vscode = require('vscode');
const fs = require('fs');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;
var _ = require('lodash');
var lineColumn = require("line-column");

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
        const start = lineColumn(original).fromIndex(original.indexOf('extends'))
        let line = null
        if (start && start.line) {
            line = start.line - 1
        }

        vscode.window.showInputBox({
            prompt: 'Insert component name',
            value: ''
        }).then(function (e) {

            if (!e || e == '') return
            const nameFile = e.toLowerCase()
            createFile(nameFile, text, original, function (err, resp) {

                if (err) {
                    vscode.window.showInformationMessage(err);
                    return
                }
                actEdit.edit(function (edit) {
                    const name = capitalizeFirstLetter(_.camelCase(e))
                    const Position = vscode.Position
                    const stringImport = `import ${name} from '../${nameFile}'\n\n`

                    if (line)
                        edit.insert(new Position(line, 0), stringImport)

                    edit.replace(selection, '<' + name + ' ' + resp + ' />')
                })

            })
        })

    });


    let disposableMethod = vscode.commands.registerCommand('extension.extractMethodComponent', function () {

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        var selection = editor.selection;
        var original = editor.document.getText()
        var text = editor.document.getText(selection)
        let actEdit = vscode.window.activeTextEditor
        let rowInsert = 0
        let column = 0
        if (original.indexOf('render()') > -1) {
            const start = lineColumn(original).fromIndex(original.indexOf('render()'))
            rowInsert = start.line - 1
            column = start.column
        } else {
            return
        }

        vscode.window.showInputBox({
            prompt: 'Insert name method (render__NAME__)',
            value: ''
        }).then(function (e) {
            if (!e || e == '') return

            const nameMethod = capitalizeFirstLetter(_.camelCase(e))
            actEdit.edit(function (edit) {
                const Position = vscode.Position
                const newtext = `\n\trender${nameMethod}(){\nreturn (\n ${text}\n)\n}\n\n`

                edit.replace(selection, '\t\t{ this.render' + nameMethod + '() }')
                edit.insert(new Position(rowInsert, column), newtext)
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


    let disposableStyle = vscode.commands.registerCommand('extension.extractStyleComponent', function () {

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        var selection = editor.selection;
        var original = editor.document.getText()
        var text = editor.document.getText(selection)
        let actEdit = vscode.window.activeTextEditor

        let newStyle = true
        let rowInsert = actEdit.document.lineCount + 1

        if (original.indexOf('StyleSheet.create') > -1) {
            const start = lineColumn(original).fromIndex(original.indexOf('StyleSheet.create'))
            //const end = start.toIndex(0, original.indexOf('})'))
            rowInsert = start.line
            newStyle = false
        }

        vscode.window.showInputBox({
            prompt: 'Insert name',
            value: ''
        }).then(function (e) {
            if (!e || e == '') return

            actEdit.edit(function (edit) {
                const Position = vscode.Position
                let stylesText = ''

                if (newStyle)
                    stylesText = `\n\nconst styles = StyleSheet.create({\n ${e}:${text} \n})`
                else
                    stylesText = `${e}:${text},\n`


                edit.replace(selection, `styles.${e}`)
                edit.insert(new Position(rowInsert, 0), stylesText);
            })
        })

    });


    context.subscriptions.push(disposable)
    context.subscriptions.push(disposableMethod)
    context.subscriptions.push(disposableEmbed)
    context.subscriptions.push(disposableStyle)


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

// DISABLED
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

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

            createFile(e.toLowerCase(), text, function (err,resp) {

                if (err) {
                    vscode.window.showInformationMessage(err);
                    return
                }
                actEdit.edit(function (edit) {
                    edit.replace(selection, '<' + capitalizeFirstLetter(e) +' '+ resp + ' />')
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
        const props = createProps(contents)
        console.log(props)

        let newContent = template.replace(new RegExp('componentName', 'g'), capitalizeFirstLetter(name))
        newContent = newContent.replace("'__CONTENTS__'", contents)
        newContent = newContent.replace("__PROPS__", props[0])

        mkdirp(getDirName(path), function (err) {
            if (err) return cb(err);
            fs.writeFile(path, newContent, () =>{
                cb(null,props[1])
            });
        });

    })

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
        
        if (m[1] != 'style'){
            props = props + `${m[2]}, `
            tag = tag + `${m[2]}={${m[2]}} `
        }
    }
    
    props = props.slice(0,-2)
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
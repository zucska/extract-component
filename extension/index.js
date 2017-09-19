const vscode = require('vscode');
const extract = require('./extract');

exports.activate = (context) => {
    const registerCommand = vscode.commands.registerCommand

    const disposableComponent = registerCommand('extension.extractComponent', extract.component);
    const disposableMethod = registerCommand('extension.extractComponentToFunction', extract.componentToFunction);
    const disposableStyle = registerCommand('extension.extractStyleComponent', extract.style);
    const disposableEmbed = registerCommand('extension.embedComponent', extract.embed);

    context.subscriptions.push(disposableComponent);
    context.subscriptions.push(disposableMethod);
    context.subscriptions.push(disposableStyle);
    context.subscriptions.push(disposableEmbed);
}

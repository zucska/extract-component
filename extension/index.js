const vscode = require('vscode');
const commands = require('./commands');

exports.activate = (context) => {
    const registerCommand = vscode.commands.registerCommand

    const disposableComponent = registerCommand('extension.extractComponentToFile', commands.extractComponentToFile);
    const disposableMethod = registerCommand('extension.extractComponentToFunction', commands.extractComponentToFunction);
    const disposableStyle = registerCommand('extension.extractStyle', commands.extractStyle);
    const disposableEmbed = registerCommand('extension.embedComponent', commands.embedComponent);

    context.subscriptions.push(disposableComponent);
    context.subscriptions.push(disposableMethod);
    context.subscriptions.push(disposableStyle);
    context.subscriptions.push(disposableEmbed);
}

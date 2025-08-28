/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
function activate(context) {
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    // The debug options for the server
    let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: ['xbasic'],
        synchronize: {
            // Synchronize the setting section 'languageServerExample' to the server
            configurationSection: 'xbasicLintServer',
            // Notify the server about file changes to '.clientrc files contain in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    // Create the language client and start the client.
    let disposable = new vscode_languageclient_1.LanguageClient('xbasicLintServer', 'Xbasic Lint Server', serverOptions, clientOptions).start();
    // Push the disposable to the context's subscriptions so that the 
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);

    // Set up DAP
    const factory = new XBasicDebugAdapterDescriptorFactory(debugPort);
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('xbasic', factory));
    // Register commands
    let disposable2 = vscode.commands.registerCommand('xbasic.startDebugging', () => {
        var _a, _b, _c;
        const editor = vscode.window.activeTextEditor;
        if (editor && (editor.document.languageId === 'xbasic' ||
            editor.document.fileName.endsWith('.a5scr') ||
            editor.document.fileName.endsWith('.a5w'))) {
            vscode.debug.startDebugging((_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0], {
                name: 'Debug BASIC Program',
                type: 'xbasic',
                request: 'launch',
                program: editor.document.fileName,
                cwd: ((_c = (_b = vscode.workspace.workspaceFolders) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.uri.fsPath) || '',
                trace: 'verbose' // <-- Add this line for trace support
            });
        }
        else {
            vscode.window.showErrorMessage('No BASIC file is currently open');
        }
    });
    context.subscriptions.push(disposable2);

}
exports.activate = activate;
class XBasicDebugAdapterDescriptorFactory {
    constructor(debugPort) {
        this.debugPort = debugPort;
    }
    createDebugAdapterDescriptor(session, executable) {
        // For now, we'll use a server-based approach
        // In a real implementation, you might want to start the interpreter as a process
        return new vscode_1.DebugAdapterServer(this.debugPort);
    }
}

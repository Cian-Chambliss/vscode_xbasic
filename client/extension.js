/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
console.log('Starting XBASIC extension');

const vscode = __importStar(require("vscode"));
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const  xb = require("xbasic-symbols");


function activate(context) {
    // The server is implemented in node
    const config = vscode.workspace.getConfiguration('xbasic');
    let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    // The debug options for the server
    let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };
    const debugPort = config.get('debugPort', 4711);

    console.log(`Debug port: ${debugPort}`);

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
    
    var providerComplete = vscode_1.languages.registerCompletionItemProvider('xbasic', {                
        provideCompletionItems: function (document, position, token, context) {
            // find out if we are completing a property in the 'dependencies' object.
            var textUntilPosition = document.getText(new vscode_1.Range(new vscode_1.Position(0,0),position));
            var completion = xb.autoComplete({textUntilPosition : textUntilPosition 
                , lineNumber : position.line+1
                , fullLine : function() { 
                    return document.lineAt(position.line).text;
                } });
            var suggest = [];
            for( var i = 0 ; i < completion.length ; ++i ) {
                var item = completion[i];
                if( item.label && item.insertText ) {
                    var kind = vscode_1.CompletionItemKind.Snippet;
                    if( item.kind ) {
                        if( item.kind == "function") {
                            kind = vscode_1.CompletionItemKind.Function;
                        } else if( item.kind == "method") {
                            kind = vscode_1.CompletionItemKind.Method;
                        }
                    }
                    var _ci =new vscode_1.CompletionItem(item.label, kind);
                    if( item.documentation ) {
                       _ci.documentation = item.documentation;
                    }
                    if( item.insertText ) {
                        _ci.insertText = item.insertText;
                    }
                    suggest.push(_ci);
                }
            }
            return suggest;
        }
    },":",".","="," ","(",","," ");
    context.subscriptions.push(providerComplete);

    var providerHover = vscode_1.languages.registerHoverProvider('xbasic', {
        provideHover(document, position, token) {
            var textUntilPosition = document.getText(new vscode_1.Range(new vscode_1.Position(0,0),position));
            //var textUntilPosition = document.lineAt(position.line).text.substr(0,position.character+2);
            var help = xb.autoHelp({textUntilPosition : textUntilPosition 
                , lineNumber : position.line+1
                , fullLine : function() { 
                    return document.lineAt(position.line).text;
                } });
             if( help ) {
                if( help.prototype) {
                    if( help.documentation)  
                        return { contents :[help.prototype,help.documentation] };
                    return { contents :[help.prototype] };
                }
            }
        }
    });
    context.subscriptions.push(providerHover);

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
                name: 'Debug XBASIC Program',
                type: 'xbasic',
                request: 'launch',
                program: editor.document.fileName,
                cwd: ((_c = (_b = vscode.workspace.workspaceFolders) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.uri.fsPath) || '',
                trace: 'verbose' // <-- Add this line for trace support
            });
        }
        else {
            vscode.window.showErrorMessage('No XBASIC file is currently open');
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

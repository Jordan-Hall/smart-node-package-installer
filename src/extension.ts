import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        correctLocalPaths(document);
        if (document.languageId === 'javascript' || document.languageId === 'typescript' || document.languageId === 'javascriptreact' || document.languageId === 'typescriptreact') {
            checkFileForImports(document);
        }
    });

	context.subscriptions.push(vscode.commands.registerCommand('extension.checkMissingPackages', () => {
		vscode.workspace.textDocuments.forEach(document => {
			if (document.languageId === 'javascript' || document.languageId === 'typescript' || document.languageId === 'javascriptreact' || document.languageId === 'typescriptreact') {
				checkFileForImports(document);
			}
		});
	}));

    context.subscriptions.push(disposable);
}

export async function checkFileForImports(document: vscode.TextDocument) {
    const content = document.getText();
    const importRegex = /^(?:import .* from |const .* = require\(['"]([^.'"].*)['"]\))/gm;
	const rootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';

    let match;
	console.log(importRegex.exec(content));

    while ((match = importRegex.exec(content)) !== null) {
        const module = match[1]
        if (module && !fs.existsSync(path.join(rootPath || '', 'node_modules', module))) {
            const packageManager = getPackageManager();
            vscode.window.showInformationMessage(`Attempting to install module ${module}`);
            exec(`${packageManager} install ${module}`, { cwd: rootPath }, (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error installing module ${module}: ${error}`);
                } else if (stderr) {
                    vscode.window.showErrorMessage(`Error installing module ${module}: ${stderr}`);
                } else {
                    vscode.window.showInformationMessage(`Successfully installed module ${module}`);
                }
            });
        }
    }
}


export async function correctLocalPaths(document: vscode.TextDocument) {
    const content = document.getText();
    const importRegex = /^(?:import .* from |const .* = require\(['"]\.\..*['"]\))/gm;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        const relativePath = match[1];

        if (!relativePath) {
            vscode.window.showErrorMessage(`Failed to parse import or require statement for local path.`);
            continue;
        }

        const absolutePath = path.join(path.dirname(document.uri.fsPath), relativePath);

        if (!fs.existsSync(absolutePath)) {
            vscode.window.showErrorMessage(`Path ${relativePath} does not exist.`);
            // Correct the path. This is a complex problem and needs a custom solution
            // based on your project's structure and requirements.
        }
    }
}


export function getPackageManager(): string {
    let rootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
    if (fs.existsSync(path.join(rootPath, 'yarn.lock'))) {
        return 'yarn';
    } else if (fs.existsSync(path.join(rootPath, 'pnpm-lock.yaml'))) {
        return 'pnpm';
    } else {
        return 'npm';
    }
	return 'npm';
}


export function deactivate() {}

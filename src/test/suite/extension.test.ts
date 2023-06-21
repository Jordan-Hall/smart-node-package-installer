import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as sinon from 'sinon';

suite('Extension Test Suite', () => {
    const sandbox = sinon.createSandbox();

	const mockFs: Record<string, boolean> = {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'/path/to/npm/project/package-lock.json': true,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'/path/to/yarn/project/yarn.lock': true,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'/path/to/pnpm/project/pnpm-lock.yaml': true,
	};
	
	sandbox.stub(fs, 'existsSync').callsFake((filePath) => {
		return mockFs[filePath as string] || false;
	});

    teardown(() => {
        sandbox.restore();
    });

    test('getPackageManager returns correct package manager', () => {
        const npmProject = { rootPath: '/path/to/npm/project/package-lock.json' };
        const yarnProject = { rootPath: '/path/to/yarn/project/yarn.lock' };
        const pnpmProject = { rootPath: '/path/to/pnpm/project/pnpm-lock.yaml' };

        sandbox.stub(fs, 'existsSync').callsFake((lockFilePath: any) => {
            if (lockFilePath.includes('yarn.lock')) {
                return lockFilePath === path.join(yarnProject.rootPath, 'yarn.lock');
            }
            if (lockFilePath.includes('pnpm-lock.yaml')) {
                return lockFilePath === path.join(pnpmProject.rootPath, 'pnpm-lock.yaml');
            }
            return lockFilePath === path.join(npmProject.rootPath, 'package-lock.json');
        });

        assert.strictEqual((myExtension.getPackageManager as any)(npmProject), 'npm');
        assert.strictEqual((myExtension.getPackageManager as any)(yarnProject), 'yarn');
        assert.strictEqual((myExtension.getPackageManager as any)(pnpmProject), 'pnpm');
    });

    test('checkFileForImports installs missing modules', () => {
        const document = { getText: () => "import missingModule from 'missing-module';", languageId: 'javascript' };
        const workspace = { rootPath: '/path/to/project' };

        sandbox.stub(fs, 'existsSync').returns(false);
        const execStub = sandbox.stub(exec, 'exec' as any);

        ((myExtension.checkFileForImports as any) as any)(document, workspace);

        assert(execStub.calledOnce);
        assert(execStub.calledWithMatch('npm install missing-module'));
    });

	test('checkFileForImports handles different import styles', () => {
		const documentImport = { getText: () => "import missingModule from 'missing-module';", languageId: 'javascript' };
		const documentRequire = { getText: () => "const missingModule = require('missing-module');", languageId: 'javascript' };
		const workspace = { rootPath: '/path/to/project' };
	
		sandbox.stub(fs, 'existsSync').returns(false);
		const execStub = sandbox.stub(exec, 'exec' as any);
	
		(myExtension.checkFileForImports as any)(documentImport, workspace);
		(myExtension.checkFileForImports as any)(documentRequire, workspace);
	
		assert.strictEqual(execStub.callCount, 2);
		assert(execStub.alwaysCalledWithMatch('npm install missing-module'));
	});
	
	// correctLocalPaths test
	test('correctLocalPaths identifies incorrect paths', () => {
		const document = { getText: () => "import localModule from './local-module';", languageId: 'javascript' };
		const workspace = { rootPath: '/path/to/project' };
	
		sandbox.stub(fs, 'existsSync').returns(false);
	
		const incorrectPaths = (myExtension.correctLocalPaths as any)(document, workspace);
	
		assert.deepStrictEqual(incorrectPaths, ['./local-module']);
	});
	
	test('correctLocalPaths doesn\'t suggest corrections for correct paths', () => {
		const document = { getText: () => "import localModule from './local-module';", languageId: 'javascript' };
		const workspace = { rootPath: '/path/to/project' };
	
		sandbox.stub(fs, 'existsSync').returns(true);
	
		const incorrectPaths = (myExtension.correctLocalPaths as any)(document, workspace);
	
		assert.deepStrictEqual(incorrectPaths, []);
	});
	
});

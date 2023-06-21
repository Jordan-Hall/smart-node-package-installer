# Auto Install Dependencies VS Code Extension

This extension for Visual Studio Code automatically checks your JavaScript, TypeScript, JSX, and TSX files for imports and require statements. If a module is not found in your project, it will automatically run the appropriate package manager command (`npm install`, `yarn add`, or `pnpm add`) to install the package.

The extension also verifies local file paths and offers auto correction of incorrect paths.

## Features

- Automatically install missing dependencies when a file is saved.
- Detect incorrect local file paths and suggest corrections.
- Detect the package manager used in the project (npm, yarn, or pnpm).

## Usage

Simply install the extension and it will automatically check your files on save.

## Settings

This extension contributes the following settings:

- `autoInstall.autoCorrectPaths`: enable or disable auto correction of incorrect local file paths.

## Release Notes

### 1.0.0

Initial release of Auto Install Dependencies.

## License

MIT

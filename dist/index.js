"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path_1 = require("path");
const fs_1 = require("fs");
let configCache = null;
let aliasCache = null;
const DEFAULT_CONFIG = {
    ext: [".wxml", ".js", ".ts", ".wxss", ".json"],
};
const activate = (context) => {
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(["wxml", "json"], {
        provideDefinition,
    }));
};
exports.activate = activate;
const deactivate = () => {
    // pass
};
exports.deactivate = deactivate;
const _getConfig = (dir, name) => {
    if (!dir || dir === "/") {
        return {};
    }
    const filePath = (0, path_1.resolve)(dir, name);
    if ((0, fs_1.existsSync)(filePath)) {
        return require(filePath);
    }
    return _getConfig((0, path_1.dirname)(dir), name);
};
const getConfig = (dir) => {
    if (configCache && Object.keys(configCache).length !== 0) {
        return configCache;
    }
    const userConfig = _getConfig(dir, "mp-component-navigator.config.js");
    const privateConfig = _getConfig(dir, "mp-component-navigator.private.config.js");
    const config = {
        ...DEFAULT_CONFIG,
        ...userConfig,
        ...privateConfig,
    };
    configCache = config;
    return config;
};
const getAlias = (fileDir) => {
    if (aliasCache && aliasCache.length !== 0) {
        return aliasCache;
    }
    const config = getConfig(fileDir);
    let alias = config.alias;
    if (typeof alias === "function") {
        alias = alias(fileDir);
    }
    alias = alias || [];
    aliasCache = alias;
    return alias;
};
const getTagName = (filePath, line, start, end) => {
    let l = start;
    let r = end;
    let invalidCharacter = [" "];
    if ((0, path_1.extname)(filePath) === ".wxml") {
        invalidCharacter = [" ", "<", ">", "/"];
    }
    else if ((0, path_1.extname)(filePath) === ".json") {
        invalidCharacter = [" ", '"', ":"];
    }
    while (!invalidCharacter.includes(line[r]) && r < line.length) {
        r++;
    }
    while (!invalidCharacter.includes(line[l]) && l > -1) {
        l--;
    }
    let result = line.substring(l, r).trim();
    for (let i = 0; i < invalidCharacter.length; i++) {
        const character = invalidCharacter[i];
        const reg = character;
        result = result.replace(new RegExp(reg, "g"), "");
    }
    return result;
};
const getSrcDir = (fileDir) => fileDir.substring(0, fileDir.indexOf("src") + 3);
const prefixResolver = (fileDir, componentPath) => {
    let resolvedPath = componentPath;
    if (resolvedPath.startsWith("@/")) {
        resolvedPath = resolvedPath.replace("@/", "/");
    }
    if (resolvedPath.startsWith("/")) {
        resolvedPath = (0, path_1.resolve)(getSrcDir(fileDir), "./" + resolvedPath);
    }
    if (resolvedPath.startsWith("@")) {
        const alias = getAlias(fileDir);
        for (let i = 0; i < alias.length; i++) {
            const alia = alias[i];
            if (resolvedPath.startsWith(alia.name)) {
                resolvedPath = resolvedPath.replace(alia.name, alia.path);
            }
        }
    }
    return (0, path_1.resolve)(fileDir, resolvedPath);
};
const getExtList = (fileDir) => {
    const config = getConfig(fileDir);
    return config.ext || [];
};
const getSuffixResolvers = (fileDir) => getExtList(fileDir)
    .map((ext) => [
    (_, componentPath) => (0, path_1.resolve)(componentPath + ext),
    (_, componentPath) => (0, path_1.resolve)(componentPath, `./index${ext}`),
])
    .flat();
const resolveComponentParh = (fileDir, componentPath) => {
    const resolvedPaths = [];
    // 先处理前缀
    const preparedComponentPath = prefixResolver(fileDir, componentPath);
    const suffixResolvers = getSuffixResolvers(fileDir);
    for (let i = 0; i < suffixResolvers.length; i++) {
        // 再处理后缀
        const suffixResolver = suffixResolvers[i];
        const resolvedPath = suffixResolver(fileDir, preparedComponentPath);
        // 判断处理后的路径是否可用
        if (resolvedPath && (0, fs_1.existsSync)(resolvedPath)) {
            resolvedPaths.push(resolvedPath);
        }
    }
    return resolvedPaths;
};
const provideDefinition = (document, position) => {
    try {
        const filePath = document.fileName;
        const fileDir = (0, path_1.dirname)(filePath);
        // 获取点击的标签名
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return null;
        }
        const line = document.lineAt(position).text;
        const tagName = getTagName(filePath, line, range.start.character, range.end.character);
        if (!tagName) {
            return null;
        }
        // 获取标签对应的组件路径，默认是从 index.json 里面读取
        const jsonFilePath = filePath.replace((0, path_1.extname)(filePath), ".json");
        if (!(0, fs_1.existsSync)(jsonFilePath)) {
            return null;
        }
        const deps = JSON.parse((0, fs_1.readFileSync)(jsonFilePath).toString()).usingComponents || {};
        const componentPath = deps[tagName];
        if (!componentPath) {
            return null;
        }
        // 解析组件路径
        const resolvedPaths = resolveComponentParh(fileDir, componentPath);
        // 返回最终结果
        return resolvedPaths.map((targetPath) => new vscode.Location(vscode.Uri.file(targetPath), new vscode.Position(0, 0)));
    }
    catch (err) {
        console.error(err);
    }
    return null;
};

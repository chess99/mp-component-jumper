# MP Component Jumper (小程序组件跳转器)

一款 VS Code 扩展, 用于在小程序项目中快速跳转到组件定义。

## 功能

支持在 `wxml` 和 `json` 文件中, 通过 **跳转到定义 (Go to Definition)** 功能, 快速定位并打开小程序组件的源文件。

## 使用方式

1. 安装插件后即可零配置使用。
2. 打开 `wxml` 或 `json` 文件, 将光标放在组件标签或路径上。
3. 使用 VS Code 的 **跳转到定义 (Go to Definition)** 功能 (如 `F12` 或 `Cmd/Ctrl + 点击`)。

## 默认行为

* **文件类型**: 默认仅查找 `.js` 和 `.ts` 后缀的组件逻辑文件。
* **路径别名**: 自动识别并加载项目 `tsconfig.json` 文件中 `compilerOptions.paths` 定义的路径别名。
* **tsconfig 继承**: 完整支持 `extends` 字段，可正确解析继承的配置（如 monorepo 场景）。
* **baseUrl 支持**: 正确处理 `compilerOptions.baseUrl`，确保路径解析准确。

## 自定义配置 (可选)

如果默认行为不满足需求, 可以在项目根目录创建 `mp-component-jumper.config.js` 文件来覆盖或扩展默认配置。

**配置方式 1: 基础配置**

```javascript
// mp-component-jumper.config.js

module.exports = {
  // 默认值是 ['.js', '.ts']
  // 如果希望跳转时也能找到视图文件, 可以像下面这样添加:
  ext: ['.js', '.ts', '.wxml', '.wxss', '.json'],

  // 插件会自动读取 tsconfig.json 的 paths 配置。
  // 此处的配置项会优先使用, 并覆盖 tsconfig.json 中的同名配置。
  alias: [
    {
      name: '@/',
      path: '/absolute/path/to/src/', // 使用绝对路径
    },
  ],
};
```

**配置方式 2: 动态配置**

```javascript
// mp-component-jumper.config.js
const path = require('path');

module.exports = {
  ext: ['.js', '.ts'],
  
  // 使用函数动态计算路径 (适用于复杂项目结构)
  alias: (fileDir) => {
    return [
      {
        name: '@/',
        path: path.resolve(fileDir, '../src/'),
      },
    ];
  },
};
```

## tsconfig.json 支持

插件完整支持 `tsconfig.json` 的路径映射功能，包括：

### 基础配置

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

### extends 继承 (Monorepo 场景)

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src/**/*"]
}
```

插件会自动解析继承链，合并所有配置，无需额外设置。

## 常见场景

### Monorepo 项目

```
/project
  /tsconfig.json          # 基础配置
  /packages
    /app1
      /tsconfig.json      # extends: ../../tsconfig.json
      /src
```

✅ 插件会正确解析继承的 `paths` 配置

### 多 baseUrl 项目

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@utils/*": ["utils/*"]  // 相对于 src 目录
    }
  }
}
```

✅ 插件会基于 `baseUrl` 正确解析路径

## 致谢

本插件修改自 [mp-component-navigator](https://marketplace.visualstudio.com/items?itemName=gexuewen.mp-component-navigator), 在其基础上进行了优化和调整以适应个人需求。感谢原作者的贡献。

# MP Component Jumper

一款 VS Code 扩展, 用于在小程序项目中快速跳转到组件定义。

## 功能

支持在 `wxml` 和 `json` 文件中，通过 **跳转到定义 (Go to Definition)** 功能，快速定位并打开小程序组件的源文件。自动解析路径别名和组件引用。

## 安装

在 VS Code 扩展市场搜索 `MP Component Jumper` 或通过以下链接安装：

- [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=mp-kit.mp-component-jumper)
- [Open VSX Registry](https://open-vsx.org/extension/mp-kit/mp-component-jumper)

## 使用方式

1. 安装插件后即可零配置使用。
2. 打开 `wxml` 或 `json` 文件, 将光标放在组件标签或路径上。
3. 使用 VS Code 的 **跳转到定义 (Go to Definition)** 功能 (如 `F12` 或 `Cmd/Ctrl + 点击`)。

## 默认行为

- **文件类型**: 默认仅查找 `.js` 和 `.ts` 后缀的组件逻辑文件
- **路径别名**: 自动识别项目 `tsconfig.json` 中定义的路径别名

## 自定义配置 (可选)

如果默认行为不满足需求, 可以在项目根目录创建 `mp-component-jumper.config.js` 文件来覆盖或扩展默认配置。

```javascript
// mp-component-jumper.config.js
const path = require('path');

module.exports = {
  // 默认值是 ['.js', '.ts']
  // 如果希望跳转时也能找到视图文件, 可以像下面这样添加:
  ext: ['.js', '.ts', '.wxml', '.wxss', '.json'],

  // 插件会自动读取 tsconfig.json 的 paths 配置。
  // 此处的配置项会优先使用, 并覆盖 tsconfig.json 中的同名配置。
  
  // 方式 1: 使用固定路径数组
  alias: [
    {
      name: '@/',
      path: path.resolve(__dirname, 'src/'),
    },
    {
      name: '@components/',
      path: path.resolve(__dirname, 'src/components/'),
    },
  ],
  
  // 方式 2: 使用函数动态计算路径（适用于复杂项目结构）
  // fileDir 是当前编辑文件所在的目录
  // alias: (fileDir) => [
  //   {
  //     name: '@/',
  //     path: path.resolve(fileDir, '../../src/'),
  //   },
  // ],
};
```

## 致谢

本插件修改自 [mp-component-navigator](https://marketplace.visualstudio.com/items?itemName=gexuewen.mp-component-navigator), 在其基础上进行了优化和调整以适应个人需求。感谢原作者的贡献。

# MP Component Jumper (小程序组件跳转器)

一款 VS Code 扩展, 用于在小程序项目中快速跳转到组件定义。

## 功能

支持在 `wxml` 和 `json` 文件中, 通过 **跳转到定义 (Go to Definition)** 功能, 快速定位并打开小程序组件的源文件。

## 使用方式

1.  安装插件后即可零配置使用。
2.  打开 `wxml` 或 `json` 文件, 将光标放在组件标签或路径上。
3.  使用 VS Code 的 **跳转到定义 (Go to Definition)** 功能 (如 `F12` 或 `Cmd/Ctrl + 点击`)。

## 默认行为

*   **文件类型**: 默认仅查找 `.js` 和 `.ts` 后缀的组件逻辑文件。
*   **路径别名**: 自动识别并加载项目 `tsconfig.json` 文件中 `compilerOptions.paths` 定义的路径别名。

## 自定义配置 (可选)

如果默认行为不满足需求, 可以在项目根目录创建 `mp-component-jumper.config.js` 文件来覆盖或扩展默认配置。

**示例: 添加对 `.wxml` 的支持并覆盖 `tsconfig` 中的别名**
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
      path: 'src/custom/', // 将 @/ 指向 src/custom/ 而不是 tsconfig.json 中配置的路径
    },
  ],
};
```

## 致谢

本插件修改自 [mp-component-navigator](https://marketplace.visualstudio.com/items?itemName=gexuewen.mp-component-navigator), 在其基础上进行了优化和调整以适应个人需求。感谢原作者的贡献。

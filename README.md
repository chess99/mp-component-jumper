# MP Component Jumper (小程序组件跳转器)

一款 VS Code 扩展, 用于在小程序项目中快速跳转到组件定义。

## 功能

支持在 `wxml` 和 `json` 文件中, 通过 **跳转到定义 (Go to Definition)** 功能, 快速定位并打开小程序组件的源文件。

## 使用方式

1. 在你的小程序项目根目录下创建一个配置文件 `mp-component-navigator.config.js` (可选, 但建议配置)。
2. 打开 `wxml` 或 `json` 文件, 将光标放在组件标签或路径上。
3. 使用 VS Code 的 **跳转到定义 (Go to Definition)** 功能。

常见的触发方式有：

* 按 `F12` 键。
* 按住 `Command` (macOS) 或 `Ctrl` (Windows/Linux) 并单击。
* 右键单击, 在菜单中选择 `跳转到定义 (Go to Definition)`。

## 配置文件示例

在你的项目根目录创建 `mp-component-navigator.config.js` 文件:

```javascript
// mp-component-navigator.config.js

module.exports = {
  // 配置组件源文件的后缀名列表。
  // "跳转到定义" 时, 插件会按此列表顺序查找所有存在的对应文件, 并提供跳转选项。
  // 例如, 跳转 'custom-component', 插件会寻找 'custom-component.wxml', 'custom-component.js' 等。
  ext: ['.wxml', '.js', '.ts', '.wxss', '.json'],

  // 配置路径别名, 用于解析绝对路径
  // 建议使用 '@/' 这种带斜杠的格式, 避免与 npm scoped packages (如 @vant/weapp) 冲突
  // 例如: `usingComponents` 中配置的路径是 `@/components/list`
  alias: [
    {
      name: '@/',
      path: 'src/', // @/ 将会映射到 src/ 目录
    },
  ],
};
```

## 致谢

本插件修改自 [mp-component-navigator](https://marketplace.visualstudio.com/items?itemName=gexuewen.mp-component-navigator), 在其基础上进行了优化和调整以适应个人需求。感谢原作者的贡献。

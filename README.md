# 群语音通话应用

一个基于WebRTC的多人实时语音通话应用，支持创建房间、加入房间、静音控制等功能。

## 功能特点

- 🎤 多人实时语音通话
- 🔗 房间分享功能
- 🔇 一键静音/取消静音
- 📱 响应式设计，支持移动端
- 🚀 支持Railway平台一键部署

## 本地开发

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 生产环境启动
```bash
npm start
```

## Railway部署

### 方法一：使用Railway CLI
1. 安装Railway CLI：
```bash
npm install -g @railway/cli
```

2. 登录Railway：
```bash
railway login
```

3. 初始化项目：
```bash
railway init
```

4. 部署：
```bash
railway up
```

### 方法二：使用GitHub集成
1. Fork本项目到您的GitHub账户
2. 在Railway控制台中创建新项目
3. 选择GitHub作为部署源
4. 选择fork的项目仓库
5. 点击部署

### 方法三：使用Railway按钮
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2Fyourusername%2Fgroup-voice-call-app)

## 使用说明

1. 打开应用后输入昵称和房间ID
2. 点击"加入房间"进入语音通话
3. 分享房间ID让其他人加入
4. 使用静音按钮控制麦克风状态

## 技术栈

- 后端：Node.js + Express + Socket.IO
- 前端：HTML5 + CSS3 + JavaScript
- 实时通信：WebRTC + Socket.IO
- 部署：Railway平台

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3000 |
| NODE_ENV | 运行环境 | production |

## 注意事项

- 首次使用需要允许麦克风权限
- 建议使用最新版本的Chrome或Firefox浏览器
- 移动设备上请确保浏览器支持WebRTC

## 许可证

MIT License
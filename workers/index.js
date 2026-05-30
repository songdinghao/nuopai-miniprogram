// workers/index.js - Worker 入口占位文件
// 微信小程序 Worker 线程入口
worker.onMessage(function (msg) {
  // Worker 消息处理
  worker.postMessage({ result: 'ok' })
})

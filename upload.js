/**
  * 诺派永生花微信小程序 — CI上传脚本
  * 用法：node upload.js [版本号]
  * 示例：node upload.js 1.0.0
  */
const ci = require('/tmp/node_modules/miniprogram-ci')
const path = require('path')

const projectPath = path.join(__dirname)
const version = process.argv[2] || '1.0.0'
const desc = process.argv[3] || '自动上传'

const project = new ci.Project({
  appid: 'wxbcad7eb19ee5bd39',
  type: 'miniProgram',
  projectPath: projectPath,
  privateKeyPath: path.join(projectPath, 'keys', 'private.wxbcad7eb19ee5bd39.key'),
  ignores: ['node_modules/**/*', 'keys/**/*']
})

async function upload() {
  try {
  const result = await ci.upload({
      project,
      version,
      desc,
      setting: {
    es6: true,
    es7: true,
    minify: true,
    autoPrefixWXSS: true
      },
      onProgressUpdate(info) {
      }
  })
  process.exit(0)
  } catch (err) {
  console.error('❌ 上传失败：', err)
  process.exit(1)
  }
}

upload()

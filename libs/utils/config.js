// 路径模块
const path = require('path')
const { configFileName } = require('./constant')
// 当前进程工作目录
const cwd = process.cwd()
// 获取配置文件信息
const cfg = require(path.resolve(cwd, configFileName))

module.exports = {
    ...cfg, // 获取配置文件信息
    path: path.resolve(cfg.path) // 配置文件路径
}

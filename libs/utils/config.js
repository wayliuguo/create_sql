// 路径模块
const path = require('path')
// 当前进程工作目录
const cwd = process.cwd()
const package = require('../../package.json')
// 获取配置文件信息
const cfg = require(path.resolve(cwd, 'createsql.cfg.json'))

module.exports = {
    ...cfg, // 获取配置文件信息
    path: path.resolve(cfg.path), // 配置文件路径
    cliVersion: package.version // 获取当前cli版本
}

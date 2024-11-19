// 当前进程工作目录
const package = require('../../package.json')
// 获取配置文件信息

module.exports = {
    cliVersion: package.version // 获取当前cli版本
}

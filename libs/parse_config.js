// 路径模块
const path = require('path')
const { configFileName } = require('./utils/constant')
// 当前进程工作目录
const cwd = process.cwd()

// 获取配置文件信息
const cfg = require(path.resolve(cwd, configFileName))

// 将路径配置转换为数组形式
function normalizePaths(pathConfig) {
    // 如果是字符串，转为数组
    if (typeof pathConfig === 'string') {
        return [path.resolve(pathConfig)]
    }
    // 如果已经是数组，解析每个路径
    else if (Array.isArray(pathConfig)) {
        return pathConfig.map(p => path.resolve(p))
    }
    // 默认返回空数组
    return []
}

// 获取全局配置
create_sql_cfg = {
    ...cfg,
    paths: normalizePaths(cfg.path || cfg.paths) // 支持 path 或 paths 配置项
}

module.exports = create_sql_cfg

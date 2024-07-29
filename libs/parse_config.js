// 路径模块
const path = require('path')
// 当前进程工作目录
const cwd = process.cwd()

// 获取配置文件信息
const cfg = require(path.resolve(cwd, 'createsql.cfg.json'))

// 获取全局配置
create_sql_cfg = {
    ...cfg,
    path: path.resolve(cfg.path)
}

module.exports = create_sql_cfg

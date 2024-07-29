// 获取配置文件
const create_sql_cfg = require('../libs/parse_config')

// 代码解析
const parse_code = require('../libs/parse_code')
// 生成sql
const generate_sql = require('../libs/generate_sql')

// 上报列表
const report_list = parse_code.parseCode(create_sql_cfg)

generate_sql.generateSql(create_sql_cfg, report_list)

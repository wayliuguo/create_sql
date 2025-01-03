#!/usr/bin/env node

// 文档链接：https://github.com/tj/commander.js/blob/master/Readme_zh-CN.md
const { program } = require('commander')
const packageConfig = require('../libs/utils/package.config')
const { configFileName } = require('../libs/utils/constant')

// 设置版本信息
program.version(packageConfig.cliVersion)

// 定义 init 命令
program
    .command('init')
    .description('初始化配置文件')
    .action(() => {
        const init_config = require('../libs/init_config')
        init_config.initConfig()
    })

// 定义 create 命令
program
    .command('create')
    .description(`根据${configFileName} 生成sql`)
    .action(() => {
        // 代码解析组件
        const parse_code = require('../libs/parse_code')
        // 生成sql组件
        const generate_sql = require('../libs/generate_sql')

        console.log('开始解析代码...')
        // 解析代码，获取上报列表
        const report_list = parse_code.parseCode()

        if (report_list.length > 0) {
            console.log('开始生成SQL...')
            // 根据上报列表生成sql
            generate_sql.generateSql(report_list)
        } else {
            console.log('未找到任何上报点，不生成SQL')
        }
    })

// 解析命令行参数
program.parse(process.argv)

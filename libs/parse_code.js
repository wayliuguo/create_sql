// 文件模块
const fs = require('fs')

// js 解析器
const acorn = require('acorn')
const walk = require('acorn-walk')

const report_config = {
    event_keys: ['hottag', 'eventPos'],
    event_name: 'eventPosName'
}

// 获取文件内容
function getFileContent(filePath) {
    return fs.readFileSync(filePath, 'utf-8')
}

// 解析文件内容为 AST
function getCodeAst(fileContent) {
    return acorn.parse(fileContent, {
        sourceType: 'module',
        ecmaVersion: 2020
    })
}

function parseCode(createSqlCfg = {}) {
    // 存储结果
    const report_list = []

    // 获取文件内容
    const fileContent = getFileContent(createSqlCfg.path)
    // 获取 AST
    const ast = getCodeAst(fileContent)

    // 遍历 AST 并查找并查找数据上报
    walk.full(ast, (node, _state, _type) => {
        if (
            node.type === 'CallExpression' && // 是否是函数调用表达式, 如 someFunction(arg1, arg2, ...)
            node.callee.type === 'MemberExpression' && // 是否是成员表达式，如 obj.method()
            node.callee.object.type === 'ThisExpression' // 是否是this表达式
        ) {
            const args = node.arguments
            if (args.length > 0 && args[0].type === 'ObjectExpression') {
                // 如果第一个参数是对象表达式，即第一个参数是一个对象
                const properties = args[0].properties
                let hottag = null
                let eventPosName = null

                properties.forEach(prop => {
                    if (report_config.event_keys.includes(prop.key.name)) {
                        hottag = prop.value.value
                    } else if (prop.key.name === report_config.event_name) {
                        eventPosName = prop.value.value
                    }
                })

                if (hottag && eventPosName) {
                    report_list.push({ hottag, eventPosName })
                }
            }
        }
    })
    return report_list
}

module.exports = {
    parseCode
}

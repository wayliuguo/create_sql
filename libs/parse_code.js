// 文件模块
const fs = require('fs')
const path = require('path')
const config = require('./utils/config')

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

// 获取目录下所有 JS 文件
function getAllJsFiles(dirPath) {
    const files = []

    function traverseDir(currentPath) {
        const items = fs.readdirSync(currentPath)

        items.forEach(item => {
            const fullPath = path.join(currentPath, item)
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
                traverseDir(fullPath)
            } else if (stat.isFile() && path.extname(fullPath) === '.js') {
                files.push(fullPath)
            }
        })
    }

    traverseDir(dirPath)
    return files
}

// 处理单个路径（可能是文件或目录）
function processPath(targetPath, report_list) {
    try {
        const stat = fs.statSync(targetPath)

        if (stat.isDirectory()) {
            // 如果是目录，获取所有 JS 文件
            const files = getAllJsFiles(targetPath)
            files.forEach(file => {
                processFile(file, report_list)
            })
        } else if (stat.isFile()) {
            // 如果是单个文件
            processFile(targetPath, report_list)
        }
    } catch (error) {
        console.error(`处理路径 ${targetPath} 时出错:`, error.message)
    }
}

// 处理单个文件
function processFile(filePath, report_list) {
    try {
        // 只处理 JS 文件
        if (path.extname(filePath) !== '.js') {
            return
        }

        const fileContent = getFileContent(filePath)
        const ast = getCodeAst(fileContent)
        parseAst(ast, report_list)
        console.log(`已解析文件: ${filePath}`)
    } catch (error) {
        console.error(`解析文件 ${filePath} 时出错:`, error.message)
    }
}

function parseCode() {
    // 存储结果
    const report_list = []

    // 处理所有配置的路径
    if (Array.isArray(config.paths) && config.paths.length > 0) {
        config.paths.forEach(targetPath => {
            processPath(targetPath, report_list)
        })
    } else {
        console.error('未配置有效的路径')
    }

    console.log(`共找到 ${report_list.length} 个上报点`)
    return report_list
}

// 将 AST 解析逻辑抽取为独立函数
function parseAst(ast, report_list) {
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
}

module.exports = {
    parseCode
}

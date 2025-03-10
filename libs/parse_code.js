// 文件模块
const fs = require('fs')
const path = require('path')
const config = require('./utils/config')

// js 解析器
const acorn = require('acorn')
const walk = require('acorn-walk')

// 上报配置
const report_config = {
    event_keys: ['hottag', 'eventPos'],
    event_name: 'eventPosName'
}

// 获取错误类型映射
const errorTypeMap = (config.errorReportConfig && config.errorReportConfig.errorTypeMap) || {
    errorReport: 'MAIN_PROCESS_ERROR',
    notMainReport: 'NOT_MAIN_PROCESS_ERROR'
}

/**
 * 获取文件内容
 * @param {string} filePath - 文件路径
 * @returns {string} 文件内容
 */
function getFileContent(filePath) {
    return fs.readFileSync(filePath, 'utf-8')
}

/**
 * 解析文件内容为 AST
 * @param {string} fileContent - 文件内容
 * @returns {Object} AST对象
 */
function getCodeAst(fileContent) {
    return acorn.parse(fileContent, {
        sourceType: 'module',
        ecmaVersion: 2020
    })
}

/**
 * 获取目录下所有 JS 文件
 * @param {string} dirPath - 目录路径
 * @returns {Array<string>} JS文件路径列表
 */
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

/**
 * 处理单个路径（可能是文件或目录）
 * @param {string} targetPath - 目标路径
 * @param {Array} report_list - 上报列表
 */
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

/**
 * 处理单个文件
 * @param {string} filePath - 文件路径
 * @param {Array} report_list - 上报列表
 */
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

/**
 * 解析代码，获取上报列表
 * @returns {Array} 上报列表
 */
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

/**
 * 创建错误上报对象
 * @param {string} methodName - 方法名
 * @param {string} errorMsg - 错误信息
 * @returns {Object} 错误上报对象
 */
function createErrorReport(methodName, errorMsg) {
    const reportType = errorTypeMap[methodName]
    return {
        hottag: reportType,
        eventPosName: `${reportType}_${errorMsg}`,
        errorMsg: errorMsg,
        isErrorReport: true,
        reportType: methodName
    }
}

/**
 * 处理错误上报调用
 * @param {string} methodName - 方法名
 * @param {Array} args - 参数列表
 * @param {Array} report_list - 上报列表
 * @returns {boolean} 是否处理成功
 */
function handleErrorReport(methodName, args, report_list) {
    if (errorTypeMap[methodName] && args.length >= 2 && args[1].type === 'Literal') {
        const errorMsg = args[1].value
        report_list.push(createErrorReport(methodName, errorMsg))
        return true
    }
    return false
}

/**
 * 处理标准上报调用
 * @param {Array} properties - 属性列表
 * @param {Array} report_list - 上报列表
 */
function handleStandardReport(properties, report_list) {
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

/**
 * 将 AST 解析逻辑抽取为独立函数
 * @param {Object} ast - AST对象
 * @param {Array} report_list - 上报列表
 */
function parseAst(ast, report_list) {
    walk.full(ast, (node, _state, _type) => {
        // 处理函数调用表达式
        if (node.type === 'CallExpression') {
            // 处理成员表达式调用，如 obj.method()
            if (node.callee.type === 'MemberExpression') {
                const args = node.arguments

                // 处理 this 上下文的调用
                if (node.callee.object.type === 'ThisExpression') {
                    const methodName = node.callee.property.name

                    // 处理错误上报
                    if (handleErrorReport(methodName, args, report_list)) {
                        return
                    }

                    // 处理标准上报
                    if (args.length > 0 && args[0].type === 'ObjectExpression') {
                        handleStandardReport(args[0].properties, report_list)
                    }
                }
                // 处理非 this 上下文的错误上报
                else if (node.callee.property) {
                    const methodName = node.callee.property.name
                    handleErrorReport(methodName, args, report_list)
                }
            }
            // 处理全局函数调用，如 func()
            else if (node.callee.type === 'Identifier') {
                const functionName = node.callee.name
                handleErrorReport(functionName, node.arguments, report_list)
            }
        }
    })
}

module.exports = {
    parseCode
}

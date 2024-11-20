const fs = require('fs')
const path = require('path')
const { configFileName } = require('../libs/utils/constant')

function getTemplateConfig() {
    const templatePath = path.join(__dirname, '../', 'createsql.cfg.template.json')
    return fs.readFileSync(templatePath, 'utf-8')
}
function initConfig() {
    const fileName = configFileName
    fs.writeFile(fileName, getTemplateConfig(), err => {
        if (err) {
            console.error('生成错误:', err)
        } else {
            console.log(`${fileName} 已生成`)
        }
    })
}
module.exports = {
    initConfig
}

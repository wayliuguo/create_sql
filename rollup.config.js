const terser = require('@rollup/plugin-terser')

module.exports = {
    input: 'bin/index.js',
    output: {
        file: 'dist/create_sql.js',
        format: 'cjs'
    },
    plugins: [terser()]
}

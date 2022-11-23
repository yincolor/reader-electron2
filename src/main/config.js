const path = require('path');
const os = require('os');
const _PROJECT_NAME = 'reader_electron'
const _PROJECT_DIR  = path.resolve( os.homedir(), '.local/share/', _PROJECT_NAME, './' );
const _PROJECT_DATA_DIR = path.resolve( _PROJECT_DIR, './data/' );

module.exports = {
    project_name: _PROJECT_NAME, 
    project_dir: _PROJECT_DIR, 
    project_data_dir: _PROJECT_DATA_DIR,
}
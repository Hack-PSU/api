// Gruntfile.js
const nodecipher = require('node-cipher');

const encryptedFiles = {
  'gcs_config.json.aes': 'gcs_config.json',
  'gcs_config_staging.json.aes': 'gcs_config.json',
  '.prod.env.aes': '.env',
  '.staging.env.aes': '.env',
  'privatekey.aes': 'config.json',
  'privatekey.staging.aes': 'config.json',
  'hackpsu-18-serviceaccount.json.aes': 'hackpsu-18-serviceaccount.json',
};

function decryptFile(filename) {
  if (!encryptedFiles[filename]) throw new Error('Illegal filename to decrypt');
  nodecipher.decryptSync({
    algorithm: 'aes-256-cbc',
    input: filename,
    output: encryptedFiles[filename],
    password: process.env.PKEY_PASS,
  });
}

function decryptStaging() {
  decryptFile('privatekey.staging.aes');
  decryptFile('gcs_config_staging.json.aes');
  decryptFile('.staging.env.aes');
  decryptFile('hackpsu-18-serviceaccount.json.aes');
}

function decryptProduction() {
  decryptFile('privatekey.aes');
  decryptFile('gcs_config.json.aes');
  decryptFile('.prod.env.aes');
  decryptFile('hackpsu-18-serviceaccount.json.aes');
}

module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-env');
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    run: {
      install: {
        cmd: 'npm',
        args: [
          'install',
        ],
      },
      doc: {
        cmd: 'npm',
        args: ['run', 'apidoc'],
      },
    },
    exec: {
      // prep     : {
      //   cmd: `cd ..; ./prepare_deploy.sh ${grunt.option('production') ? 'prod' : ''}`,
      // },
      sql_proxy: {
        cmd: './cloud_sql_proxy -instances=hackpsu18:us-central1:hackpsu18=tcp:3306 -credential_file=./lib/hackpsu-18-serviceaccount.json &',
      },
      deploy: {
        cmd: `gcloud app deploy --quiet ${grunt.option('production') ? 'app.yaml' : 'staging.app.yaml'}`,
      },
    },
    copy: {
      keys: {
        files: [
          {
            src: 'config.json', cwd: './', dest: './lib/', expand: true,
          },
          {
            src: 'gcs_config.json', cwd: './', dest: './lib/', expand: true,
          },
        ],
      },
      assets: {
        files: [
          {
            src: './lib/assets/constants/RSVP_Email.html',
            cwd: './',
            dest: './dist/assets/constants/',
            expand: true,
          },
          {
            src: './lib/assets/emails', cwd: './', dest: './dist/assets/emails', expand: true,
          },
          {
            src: './lib/assets/schemas', cwd: './', dest: './dist/assets/schemas', expand: true,
          },
        ],
      },
    },
    env: {
      test: {
        NODE_ENV: `${grunt.option('debug') ? 'DEBUG' : 'STAGING'}`,
        APP_ENV: `${grunt.option('debug') ? 'DEBUG' : 'STAGING'}`,
        SQL_DATABASE: 'test',
        SQL_HOSTNAME: 'localhost',
      },
    },
  });
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask(
    'decrypt',
    'Decrypt the corresponding files based on environment',
    () => (grunt.option('production') ? decryptProduction() : decryptStaging()),
  );
  grunt.registerTask('default', ['env:test', 'decrypt', 'copy:keys', 'exec:sql_proxy', 'run:install', 'run:doc']);
  grunt.registerTask('start', ['env:test', 'decrypt', 'copy', 'exec:sql_proxy', 'run:install', 'copy:assets']);
  grunt.registerTask('test', ['env:test', 'decrypt', 'copy', 'exec:sql_proxy', 'run:install', 'copy:assets']);
  grunt.registerTask('prep', ['decrypt', 'copy', 'run:doc', 'run:install', 'copy:assets']);
  grunt.registerTask('deploy', ['prep', 'exec:deploy']);
};


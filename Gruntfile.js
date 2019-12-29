// Gruntfile.js
const nodecipher = require('node-cipher');
const { spawn } = require('cross-spawn');
const { Util } = require('./src/JSCommon/util');

const encryptedFiles = {
  'gcs_config.json.aes': 'gcs_config.json',
  'gcs_config_staging.json.aes': 'gcs_config.json',
  '.prod.env.aes': '.env',
  '.staging.env.aes': '.env',
  '.test.env.aes': '.env',
  'privatekey.aes': 'firebase_config.json',
  'privatekey.staging.aes': 'firebase_config.json',
  'hackpsu-18-serviceaccount.json.aes': 'hackpsu-18-serviceaccount.json',
};

function decryptFile(filename) {
  if (!encryptedFiles[filename]) throw new Error('Illegal filename to decrypt');
  nodecipher.decryptSync({
    algorithm: 'aes-256-cbc',
    input: `encrypted/${filename}`,
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

function decryptTest() {
  decryptFile('privatekey.staging.aes');
  decryptFile('gcs_config_staging.json.aes');
  decryptFile('.test.env.aes');
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
      deploy: {
        cmd: `gcloud app deploy ${grunt.option('production') ? 'app.v2.yaml ' : 'staging.v2.app.yaml'} --quiet --no-user-output-enabled`,
      },
    },
    copy: {
      keys: {
        files: [
          {
            src: 'hackpsu-18-serviceaccount.json', cwd: './', dest: './src/', expand: true,
          },
          {
            src: 'firebase_config.json', cwd: './', dest: './lib/', expand: true,
          },
          {
            src: 'gcs_config.json', cwd: './', dest: './lib/', expand: true,
          },
        ],
      },
      assets: {
        files: [
          {
            src: './RSVP_Email.html',
            cwd: './src/assets/constants',
            dest: './lib/assets/constants/',
            expand: true,
          },
          {
            src: '**', cwd: './src/assets/emails/', dest: './lib/assets/emails', expand: true,
          },
          {
            src: '**', cwd: './src/assets/schemas/', dest: './lib/assets/schemas', expand: true,
          },
        ],
      },
      binary: {
        files: [
          {
            src: './www', cwd: './src/bin/', dest: './lib/bin/', expand: true,
          },
        ],
      },
    },
    env: {
      test: {
        options: {
          add: {
            NODE_ENV: `${grunt.option('debug') ? 'DEBUG' : 'STAGING'}`,
            APP_ENV: `${grunt.option('debug') ? 'DEBUG' : 'STAGING'}`,
            SQL_DATABASE: Util.readEnv('SQL_DATABASE', 'test'),
            SQL_HOSTNAME: 'localhost',
          },
        },
      },
    },
  });
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask(
    'decrypt',
    'Decrypt the corresponding files based on environment',
    () => (grunt.option('production') ? decryptProduction() : (grunt.option('test') ? decryptTest() : decryptStaging())),
  );
  // grunt.registerTask('sql_proxy', 'Runs the SQL proxy connection to the database', () => runCloudProxy());
  grunt.registerTask('default', ['env:test', 'decrypt', 'copy', 'run:install', 'run:doc']);
  grunt.registerTask('start', ['env:test', 'decrypt', 'copy', 'run:install', 'copy:assets']);
  grunt.registerTask('test', ['env:test', 'decrypt', 'copy', 'run:install', 'copy:assets']);
  grunt.registerTask('travis', ['decrypt', 'copy', 'run:install', 'copy:assets']);
  grunt.registerTask('prep', ['decrypt', 'copy', 'run:doc', 'run:install']);
  grunt.registerTask('deploy', ['prep', 'exec:deploy']);
};


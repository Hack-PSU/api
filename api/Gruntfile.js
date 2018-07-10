// Gruntfile.js
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
      test: {
        cmd: 'npm',
        args: ['test'],
      },
      start: {
        cmd: 'npm',
        args: ['start'],
      },
    },
    exec: {
      prep: {
        cmd: `cd ..; ./prepare_deploy.sh ${grunt.option('production') ? 'prod' : ''}`,
      },
      sql_proxy: {
        cmd: 'mkdir -p /cloudsql;' +
        './cloud_sql_proxy -dir /cloudsql -credential_file ./gcs_config.json --instances=hackpsu18:us-central1:hackpsu18=tcp:3306 &',
      },
      deploy: {
        cmd: `gcloud app deploy --quiet ${grunt.option('production') ? 'app.yaml' : 'staging.app.yaml'}`,
      },
    },
    env: {
      test: {
        NODE_ENV: 'test',
        APP_ENV: 'test',
        SQL_DATABASE: 'test',
        SQL_HOSTNAME: 'localhost',
      },
    },
  });
  grunt.loadNpmTasks('grunt-run');
  grunt.registerTask('default', ['env:test', 'exec:prep', 'exec:sql_proxy', 'run:install', 'run:doc', 'run:test']);
  grunt.registerTask('start', ['env:test', 'exec:prep', 'run:install', 'exec:sql_proxy', 'run:start']);
  grunt.registerTask('test', ['env:test', 'exec:prep', 'exec:sql_proxy','run:test']);
  grunt.registerTask('deploy', ['exec:prep', 'exec:deploy']);
};

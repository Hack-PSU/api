// Gruntfile.js
module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-exec');
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
        cmd: 'cd .. && prepare_deploy.sh',
      },
      sql_proxy: {
        cmd: 'mkdir -p /cloudsql;' +
        './cloud_sql_proxy -dir /cloudsql --instances=hackpsu18:us-central1:hackpsu18=tcp:3306 &',
      },
    },
  });
  grunt.loadNpmTasks('grunt-run');
  grunt.registerTask('default', ['exec', 'run:install', 'run:doc', 'run:test']);
  grunt.registerTask('start', ['exec', 'run:install', 'run:start']);
  grunt.registerTask('test', ['exec:prep', 'run:test']);
};

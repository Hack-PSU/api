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
    },
    exec: {
      prep: {
        cmd: 'cd .. && prepare_deploy.sh',
      },
    },
  });
  grunt.loadNpmTasks('grunt-run');
  grunt.registerTask('default', ['exec', 'run']);
  grunt.registerTask('test', ['exec:prep', 'run:test']);
};

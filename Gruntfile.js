
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        sourceMap: true
      },
      main: {
        files: {
          'src/logmatic.min.js': [ 'src/logmatic.js' ]
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', [ 'uglify' ]);
};

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
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.registerTask('default', [ 'uglify' ]);
  
};

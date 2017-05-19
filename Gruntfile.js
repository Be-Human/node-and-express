module.exports = function(grunt){

	// load plugins
	[
		'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-contrib-less',
		'grunt-contrib-uglify',
		'grunt-contrib-cssmin',
		'grunt-hashres',
		'grunt-exec',
	].forEach(function(task){
		grunt.loadNpmTasks(task);
	});

	// configure plugins
	grunt.initConfig({
		cafemocha: {
			all: { src: 'qa/tests-*.js', options: { ui: 'tdd' }, }
		},
		less: {
         	development: {
				options: {
					customFunctions: {
						static: function(lessObject, name) {
							return 'url("' +
								require('./lib/static.js').map(name.value) +
								'")';
						}
					}
				},
				files: {
					'public/css/main.css': 'less/main.less',
					'public/css/cart.css': 'less/cart.less',
				}
			}
		},
		uglify: {
			all: {
				files: {
					'public/js.min/main.min.js': ['public/js/**/*.js']
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'public/css/main.css': ['public/css/**/*.css',
					'!public/css/main*.css']
				}
			},
			minify: {
				src: 'public/css/main.css',
				dest: 'public/css/main.min.css',
			},
		},
		hashres: {
			options: {
				fileNameFormat: '${name}.${hash}.${ext}'
			},
			all: {
				src: [
					'public/js.min/main.min.js',
					'public/css/main.min.css',
				],
				dest: [
					'config.js',
				]
			},
		},
		jshint: {
			// app: ['index.js', 'public/js/**/*.js', 'lib/**/*.js'],
			app: ['index.js'],
			// qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
		},
		// exec: {
		// 	linkchecker: { cmd: 'linkchecker http://localhost:3000' }
		// },
	});	

	// register tasks
	// grunt.registerTask('default', ['cafemocha','jshint','exec']);
	grunt.registerTask('default', ['cafemocha', 'jshint']);
    grunt.registerTask('static', ['less', 'cssmin', 'uglify', 'hashres']);
};

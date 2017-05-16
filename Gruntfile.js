module.exports = function(grunt){

	// load plugins
	[
		// 'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-exec',
	].forEach(function(task){
		grunt.loadNpmTasks(task);
	});

	// configure plugins
	grunt.initConfig({
		// cafemocha: {
		// 	all: { src: 'qa/tests-*.js', options: { ui: 'tdd' }, }
		// },
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
	grunt.registerTask('default', ['jshint']);
};

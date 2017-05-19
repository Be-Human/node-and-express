module.exports = {
	bundles: {
		clientJavaScript: {
			main: {
				file: '/js.min/main.min.js',
				location: 'head',
				contents: [
					'/js/contact.js',
					'/js/cart.js',
				]
			}
		},
		clientCss: {
			main: {
				file: '/css/main.min.css',
				contents: [
					'/css/main.css',
					'/css/cart.css',
				]
			}
		},
	},
}

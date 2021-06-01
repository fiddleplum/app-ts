// const TSConfigPathsWebpackPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
	entry: './src/app.ts',
	output: {
		filename: 'script.js',
		library: 'Elm'
	},
	resolve: {
		extensions: ['.ts', '.js']
		// plugins: [new TSConfigPathsWebpackPlugin()]
	},
	watchOptions: {
		aggregateTimeout: 1000,
		poll: 1000,
	},
	module: {
		rules: [{
			test: /\.ts$/,
			loader: 'ts-loader'
		}]
	},
	stats: {
		assets: false,
	}
};

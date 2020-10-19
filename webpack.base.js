const TSConfigPathsWebpackPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
	entry: './src/app.ts',
	output: {
		filename: 'script.js'
	},
	resolve: {
		extensions: ['.ts', '.js'],
		plugins: [new TSConfigPathsWebpackPlugin()]
	},
	devServer:{
		contentBase: 'src',
		watchContentBase: true
	},
	watchOptions: {
		aggregateTimeout: 1000,
		poll: 1000,
	},
	module: {
		rules: [{
			test: /\.ts$/,
			loader: 'ts-loader'
		}, {
			test: /\.(css|svg|html)$/,
			use: 'raw-loader'
		}]
	},
	stats: {
		assets: false,
	},
	devServer: {
		stats: 'errors-only'
	}
};

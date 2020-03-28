module.exports = {
	entry: './src/app.ts',
	output: {
		filename: 'script.js'
	},
	resolve: {
		extensions: ['.webpack.js', '.web.js', '.ts', '.js']
	},
	module: {
		rules: [{
			test: /\.ts$/,
			loader: 'ts-loader'
		}, {
			test: /\.(css|svg|html)$/,
			use: 'raw-loader'
		}]
	}
};

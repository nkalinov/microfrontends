process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const mode =
  process.env.NODE_ENV === 'development' ? 'development' : 'production';

module.exports = {
  mode,
  entry: './src/index.tsx',
  devtool: 'source-map',

  output: {
    clean: true,
    library: {
      type: 'umd',
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

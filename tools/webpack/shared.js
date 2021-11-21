/**
 * External dependencies
 */
const { join } = require( 'path' );
const { ProgressPlugin } = require( 'webpack' );
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const { DefinePlugin } = require( 'webpack' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const { compact } = require( 'lodash' );
const postcss = require( 'postcss' );
const threadLoader = require( 'thread-loader' );

/**
 * WordPress dependencies
 */
const ReadableJsAssetsWebpackPlugin = require( '@wordpress/readable-js-assets-webpack-plugin' );

/**
 * Internal dependencies
 */
const { dependencies } = require( '../../package.json' );

const {
	NODE_ENV: mode = 'development',
	WP_DEVTOOL: devtool = mode === 'production'
		? false
		: 'eval-cheap-source-map',
	EXPERIMENTAL_BUILD: __experimentalBuild = false,
} = process.env;

const baseConfig = {
	target: 'browserslist',
	optimization: {
		// Only concatenate modules in production, when not analyzing bundles.
		concatenateModules:
			mode === 'production' && ! process.env.WP_BUNDLE_ANALYZER,
		minimizer: [
			new TerserPlugin( {
				parallel: true,
				terserOptions: {
					output: {
						comments: /translators:/i,
					},
					compress: {
						passes: 2,
					},
					mangle: {
						reserved: [ '__', '_n', '_nx', '_x' ],
					},
				},
				extractComments: false,
			} ),
		],
	},
	mode,
	module: {
		rules: compact( [
			mode !== 'production' && {
				test: /\.js$/,
				use: require.resolve( 'source-map-loader' ),
				enforce: 'pre',
			},
		] ),
	},
	watchOptions: {
		ignored: [
			'**/node_modules',
			'**/packages/*/src/**/*.{js,ts,tsx,scss}',
		],
		aggregateTimeout: 500,
	},
	devtool,
};

const plugins = [
	// The WP_BUNDLE_ANALYZER global variable enables a utility that represents bundle
	// content as a convenient interactive zoomable treemap.
	process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
	new DefinePlugin( {
		// Inject the `GUTENBERG_PHASE` global, used for feature flagging.
		'process.env.GUTENBERG_PHASE': JSON.stringify(
			parseInt( process.env.npm_package_config_GUTENBERG_PHASE, 10 ) || 1
		),
	} ),
	mode === 'production' && new ReadableJsAssetsWebpackPlugin(),
];

const stylesTransform = ( content ) => {
	if ( mode === 'production' ) {
		return postcss( [
			require( 'cssnano' )( {
				preset: [
					'default',
					{
						discardComments: {
							removeAll: true,
						},
					},
				],
			} ),
		] )
			.process( content, {
				from: 'src/app.css',
				to: 'dest/app.css',
			} )
			.then( ( result ) => result.css );
	}
	return content;
};

const BLOCK_LIBRARY_SOURCE_PATH = join(
	__dirname,
	'..',
	'..',
	'packages',
	'block-library',
	'src'
);

const WORDPRESS_NAMESPACE = '@wordpress/';
const BUNDLED_PACKAGES = [ '@wordpress/icons', '@wordpress/interface' ];

const GUTENBERG_PACKAGES = Object.keys( dependencies )
	.filter(
		( packageName ) =>
			! BUNDLED_PACKAGES.includes( packageName ) &&
			packageName.startsWith( WORDPRESS_NAMESPACE ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'react-native' )
	)
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

if ( __experimentalBuild ) {
	threadLoader.warmup( {}, [ require.resolve( 'babel-loader' ) ] );

	baseConfig.module.rules = [
		{
			test: /\.[tj]sx?$/,
			exclude: /node_modules/,
			use: [
				require.resolve( 'thread-loader' ),
				{
					loader: require.resolve( 'babel-loader' ),
					options: {
						// Babel uses a directory within local node_modules
						// by default. Use the environment variable option
						// to enable more persistent caching.
						cacheDirectory:
							process.env.BABEL_CACHE_DIRECTORY || true,
					},
				},
			],
		},
	];
	baseConfig.resolve = {
		extensions: [ '.ts', '.tsx', '...' ],
		// "react-native" field usually has the source entry file.
		mainFields: [ 'react-native', 'browser', 'module', 'main' ],
	};
	delete baseConfig.watchOptions;
	baseConfig.stats =
		mode === 'production'
			? 'normal'
			: {
					preset: 'minimal',
					version: false,
					modules: false,
					assets: false,
			  };

	plugins.push(
		new ProgressPlugin( {
			modules: false,
			dependencies: false,
			percentBy: 'entries',
		} )
	);
}

module.exports = {
	__experimentalBuild,
	baseConfig,
	plugins,
	stylesTransform,
	BLOCK_LIBRARY_SOURCE_PATH,
	GUTENBERG_PACKAGES,
};

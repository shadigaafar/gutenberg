/**
 * External dependencies
 */
const { join } = require( 'path' );
const { existsSync, readdirSync } = require( 'fs' );
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const IgnoreEmitPlugin = require( 'ignore-emit-webpack-plugin' );

/**
 * Internal dependencies
 */
const {
	baseConfig,
	BLOCK_LIBRARY_SOURCE_PATH,
	GUTENBERG_PACKAGES,
} = require( './shared' );

function getEntries() {
	// Hardcoded entries.
	const entry = {
		'block-editor/default-editor-styles':
			'./packages/block-editor/src/default-editor-styles.scss',
		'block-library/style': join( BLOCK_LIBRARY_SOURCE_PATH, 'style.scss' ),
		'block-library/reset': join( BLOCK_LIBRARY_SOURCE_PATH, 'reset.scss' ),
		'block-library/editor': join(
			BLOCK_LIBRARY_SOURCE_PATH,
			'editor.scss'
		),
		'block-library/theme': join( BLOCK_LIBRARY_SOURCE_PATH, 'theme.scss' ),
	};

	// "src/style.scss" in each package.
	for ( const packageName of GUTENBERG_PACKAGES ) {
		const stylePath = `./packages/${ packageName }/src/style.scss`;
		if ( existsSync( stylePath ) ) {
			entry[ `${ packageName }/style` ] = stylePath;
		}
	}

	// CSS for each block in block-library (block-library/{blockName}):
	//  - "style.scss",
	//  - "editor.css",
	//  - "theme.css",
	const blockLibrary = readdirSync( BLOCK_LIBRARY_SOURCE_PATH, {
		withFileTypes: true,
	} )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => dirent.name );

	for ( const blockName of blockLibrary ) {
		[ 'style', 'editor', 'theme' ].forEach( ( styleFile ) => {
			const stylePath = join(
				BLOCK_LIBRARY_SOURCE_PATH,
				blockName,
				`${ styleFile }.scss`
			);
			if ( existsSync( stylePath ) ) {
				entry[
					`block-library/blocks/${ blockName }/${ styleFile }`
				] = stylePath;
			}
		} );
	}

	return entry;
}

module.exports = {
	...baseConfig,
	devtool: baseConfig.mode === 'production' ? false : 'source-map',
	name: 'styles',
	entry: getEntries(),
	output: {
		// The output JS file is necessary only for webpack to work,
		// but it's not imported into any bundle and will be ignored when emitting.
		filename: '[name].unused-style-output.js',
		path: join( __dirname, '..', '..', 'build' ),
	},
	module: {
		rules: [
			{
				test: /\.s[ac]ss$/,
				use: [
					MiniCSSExtractPlugin.loader,
					require.resolve( 'css-loader' ),
					{
						loader: require.resolve( 'postcss-loader' ),
						options: {
							postcssOptions: {
								plugins: [
									...require( '@wordpress/postcss-plugins-preset' ),
									baseConfig.mode === 'production' &&
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
								].filter( Boolean ),
							},
							sourceMap: baseConfig.mode !== 'production',
						},
					},
					{
						loader: require.resolve( 'sass-loader' ),
						options: {
							sourceMap: baseConfig.mode !== 'production',
							additionalData: `@use "sass:math";
@import "colors";
@import "breakpoints";
@import "variables";
@import "mixins";
@import "animations";
@import "z-index";
@import "default-custom-properties";`,
							sassOptions: {
								includePaths: [
									join(
										__dirname,
										'..',
										'..',
										'packages',
										'base-styles'
									),
								],
							},
						},
					},
				],
			},
		],
	},
	plugins: [
		new MiniCSSExtractPlugin( { filename: '[name].css' } ),
		new RtlCssPlugin( {
			filename: '[name]-rtl.css',
		} ),
		new IgnoreEmitPlugin( /\.unused-style-output\.js$/ ),
	],
	resolve: {
		extensions: [ '.scss', '.css' ],
		mainFiles: [ 'style', 'src/style' ],
	},
};

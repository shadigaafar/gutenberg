/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { join } = require( 'path' );

/**
 * WordPress dependencies
 */
const {
	camelCaseDash,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const {
	__experimentalBuild,
	baseConfig,
	plugins,
	GUTENBERG_PACKAGES,
	stylesTransform,
} = require( './shared' );

const exportDefaultPackages = [
	'api-fetch',
	'deprecated',
	'dom-ready',
	'redux-routine',
	'token-list',
	'server-side-render',
	'shortcode',
	'warning',
];

function getEntries() {
	const entry = {};

	for ( const packageName of GUTENBERG_PACKAGES ) {
		entry[ packageName ] = {
			import: `./packages/${ packageName }`,
			library: {
				name: [ 'wp', camelCaseDash( packageName ) ],
				type: 'window',
				export: exportDefaultPackages.includes( packageName )
					? 'default'
					: undefined,
			},
		};
	}

	return entry;
}

module.exports = {
	...baseConfig,
	name: 'packages',
	entry: getEntries(),
	output: {
		devtoolNamespace: 'wp',
		filename: '[name]/index.min.js',
		path: join( __dirname, '..', '..', 'build' ),
	},
	plugins: [
		...plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		! __experimentalBuild &&
			new CopyWebpackPlugin( {
				patterns: GUTENBERG_PACKAGES.map( ( packageName ) => ( {
					from: '*.css',
					context: `./packages/${ packageName }/build-style`,
					to: packageName,
					transform: stylesTransform,
					noErrorOnMissing: true,
				} ) ),
			} ),
	].filter( Boolean ),
};

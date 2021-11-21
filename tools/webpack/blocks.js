/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { escapeRegExp } = require( 'lodash' );
const { join, sep } = require( 'path' );
const { existsSync, readdirSync } = require( 'fs' );
const fastGlob = require( 'fast-glob' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const {
	__experimentalBuild,
	baseConfig,
	plugins,
	stylesTransform,
	BLOCK_LIBRARY_SOURCE_PATH,
} = require( './shared' );

/*
 * Matches a block's name in paths in the form
 * build-module/<blockName>/view.js
 */
const blockNameRegex = new RegExp( /(?<=build-module\/).*(?=(\/view))/g );

const createEntrypoints = () => {
	/*
	 * Returns an array of paths to view.js files within the `@wordpress/block-library` package.
	 * These paths can be matched by the regex `blockNameRegex` in order to extract
	 * the block's name.
	 *
	 * Returns an empty array if no files were found.
	 */
	const blockViewScriptPaths = fastGlob.sync(
		'./packages/block-library/build-module/**/view.js'
	);

	/*
	 * Go through the paths found above, in order to define webpack entry points for
	 * each block's view.js file.
	 */
	return blockViewScriptPaths.reduce( ( entries, scriptPath ) => {
		const [ blockName ] = scriptPath.match( blockNameRegex );

		return {
			...entries,
			[ 'blocks/' + blockName ]: scriptPath,
		};
	}, {} );
};

function getEntries() {
	const entry = {};

	const blockNames = readdirSync( BLOCK_LIBRARY_SOURCE_PATH, {
		withFileTypes: true,
	} )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => dirent.name );

	for ( const blockName of blockNames ) {
		const scriptPath = join(
			BLOCK_LIBRARY_SOURCE_PATH,
			blockName,
			'view.js'
		);
		if ( existsSync( scriptPath ) ) {
			entry[ `blocks/${ blockName }` ] = scriptPath;
		}
	}

	return entry;
}

module.exports = {
	...baseConfig,
	name: 'blocks',
	entry: __experimentalBuild ? getEntries() : createEntrypoints(),
	output: {
		devtoolNamespace: 'wp',
		filename: 'block-library/[name]/view.min.js',
		path: join( __dirname, '..', '..', 'build' ),
	},
	plugins: [
		...plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: false } ),
		new CopyWebpackPlugin( {
			patterns: [].concat(
				__experimentalBuild
					? []
					: [
							'style',
							'style-rtl',
							'editor',
							'editor-rtl',
							'theme',
							'theme-rtl',
					  ].map( ( filename ) => ( {
							from: `./packages/block-library/build-style/*/${ filename }.css`,
							to( { absoluteFilename } ) {
								const [ , dirname ] = absoluteFilename.match(
									new RegExp(
										`([\\w-]+)${ escapeRegExp(
											sep
										) }${ filename }\\.css$`
									)
								);

								return join(
									'block-library/blocks',
									dirname,
									filename + '.css'
								);
							},
							transform: stylesTransform,
					  } ) ),
				Object.entries( {
					'./packages/block-library/src/': 'block-library/blocks/',
					'./packages/edit-widgets/src/blocks/':
						'edit-widgets/blocks/',
					'./packages/widgets/src/blocks/': 'widgets/blocks/',
				} ).flatMap( ( [ from, to ] ) => [
					{
						from: `${ from }/**/index.php`,
						to( { absoluteFilename } ) {
							const [ , dirname ] = absoluteFilename.match(
								new RegExp(
									`([\\w-]+)${ escapeRegExp(
										sep
									) }index\\.php$`
								)
							);

							return join( to, `${ dirname }.php` );
						},
						transform: ( content ) => {
							content = content.toString();

							// Within content, search for any function definitions. For
							// each, replace every other reference to it in the file.
							return (
								Array.from(
									content.matchAll(
										/^\s*function ([^\(]+)/gm
									)
								)
									.reduce( ( result, [ , functionName ] ) => {
										// Prepend the Gutenberg prefix, substituting any
										// other core prefix (e.g. "wp_").
										return result.replace(
											new RegExp( functionName, 'g' ),
											( match ) =>
												'gutenberg_' +
												match.replace( /^wp_/, '' )
										);
									}, content )
									// The core blocks override procedure takes place in
									// the init action default priority to ensure that core
									// blocks would have been registered already. Since the
									// blocks implementations occur at the default priority
									// and due to WordPress hooks behavior not considering
									// mutations to the same priority during another's
									// callback, the Gutenberg build blocks are modified
									// to occur at a later priority.
									.replace(
										/(add_action\(\s*'init',\s*'gutenberg_register_block_[^']+'(?!,))/,
										'$1, 20'
									)
							);
						},
						noErrorOnMissing: true,
					},
					{
						from: `${ from }/*/block.json`,
						to( { absoluteFilename } ) {
							const [ , dirname ] = absoluteFilename.match(
								new RegExp(
									`([\\w-]+)${ escapeRegExp(
										sep
									) }block\\.json$`
								)
							);

							return join( to, dirname, 'block.json' );
						},
					},
				] )
			),
		} ),
	].filter( Boolean ),
};

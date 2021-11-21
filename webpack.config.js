/**
 * Internal dependencies
 */
const { __experimentalBuild } = require( './tools/webpack/shared' );
const blocksConfig = require( './tools/webpack/blocks' );
const packagesConfig = require( './tools/webpack/packages' );
const stylesConfig = require( './tools/webpack/styles' );

module.exports = [
	blocksConfig,
	packagesConfig,
	__experimentalBuild && stylesConfig,
].filter( Boolean );

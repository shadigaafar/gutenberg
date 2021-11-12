/**
 * External dependencies
 */
import { createBrowserHistory } from 'history';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

export const history = createBrowserHistory();

window.npmHistory = history;

export function push( params, state ) {
	history.push( addQueryArgs( '', params ), state );
}

export function replace( params, state ) {
	history.replace( addQueryArgs( '', params ), state );
}

export function back() {
	history.back();
}

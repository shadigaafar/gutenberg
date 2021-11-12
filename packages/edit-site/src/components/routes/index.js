/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useEffect,
	useContext,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { history } from './history';

const RoutesContext = createContext();

export function useLocation() {
	return useContext( RoutesContext );
}

function getLocationWithParams( location ) {
	const searchParams = new URLSearchParams( location.search );
	return {
		...location,
		params: Object.fromEntries( searchParams.entries() ),
	};
}

export function Routes( { children } ) {
	const [ location, setLocation ] = useState( () =>
		getLocationWithParams( history.location )
	);

	useEffect( () => {
		return history.listen( ( { location: updatedLocation } ) => {
			setLocation( getLocationWithParams( updatedLocation ) );
		} );
	}, [] );

	return (
		<RoutesContext.Provider value={ location }>
			{ children( location ) }
		</RoutesContext.Provider>
	);
}

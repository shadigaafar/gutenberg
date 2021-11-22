/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useNavigationMenu( ref ) {
	return useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				getEntityRecords,
				hasFinishedResolution,
			} = select( coreStore );

			const navigationMenuSingleArgs = [
				'postType',
				'wp_navigation',
				ref,
			];
			const navigationMenu = ref
				? getEditedEntityRecord( ...navigationMenuSingleArgs )
				: null;
			const hasResolvedNavigationMenu = ref
				? hasFinishedResolution(
						'getEditedEntityRecord',
						navigationMenuSingleArgs
				  )
				: false;

			const navigationMenuMultipleArgs = [
				'postType',
				'wp_navigation',
				{ per_page: -1 },
			];
			const navigationMenus = getEntityRecords(
				...navigationMenuMultipleArgs
			);

			const canSwitchNavigationMenu = ref
				? navigationMenus?.length > 1
				: navigationMenus?.length > 0;

			return {
				isNavigationMenuResolved: hasResolvedNavigationMenu,
				isNavigationMenuMissing:
					! ref || ( hasResolvedNavigationMenu && ! navigationMenu ),
				canSwitchNavigationMenu,
				hasResolvedNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					navigationMenuMultipleArgs
				),
				navigationMenu,
				navigationMenus,
			};
		},
		[ ref ]
	);
}

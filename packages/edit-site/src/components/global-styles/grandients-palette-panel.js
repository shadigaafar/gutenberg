/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalColorEdit as ColorEdit,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';

export default function GradientPalettePanel( { name } ) {
	const [ themeGradients, setThemeGradients ] = useSetting(
		'color.gradients.theme',
		name
	);
	const [ baseThemeGradients ] = useSetting(
		'color.gradients.theme',
		name,
		'base'
	);
	const [ defaultGradients, setDefaultGradients ] = useSetting(
		'color.gradients.default',
		name
	);
	const [ baseDefaultGradients ] = useSetting(
		'color.gradients.default',
		name,
		'base'
	);
	const [ customGradients, setCustomGradients ] = useSetting(
		'color.gradients.user',
		name
	);

	const [ defaultPaletteEnabled ] = useSetting(
		'color.defaultGradients',
		name
	);
	console.log( {
		themeGradients,
		defaultGradients,
		customGradients,
		defaultPaletteEnabled,
	} );
	return (
		<VStack
			className="edit-site-global-styles-gradient-palette-panel"
			spacing={ 10 }
		>
			{ !! themeGradients && !! themeGradients.length && (
				<ColorEdit
					canReset={ themeGradients !== baseThemeGradients }
					canOnlyChangeValues
					gradients={ themeGradients }
					onChange={ setThemeGradients }
					paletteLabel={ __( 'Theme' ) }
				/>
			) }
			{ !! defaultGradients &&
				!! defaultGradients.length &&
				!! defaultPaletteEnabled && (
					<ColorEdit
						canReset={ defaultGradients !== baseDefaultGradients }
						canOnlyChangeValues
						gradients={ defaultGradients }
						onChange={ setDefaultGradients }
						paletteLabel={ __( 'Default' ) }
					/>
				) }
			<ColorEdit
				gradients={ customGradients }
				onChange={ setCustomGradients }
				paletteLabel={ __( 'Custom' ) }
				emptyMessage={ __(
					'Custom gradients are empty! Add some gradients to create your own palette.'
				) }
				slugPrefix="custom-"
			/>
		</VStack>
	);
}

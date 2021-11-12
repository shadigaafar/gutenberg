/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { arrowLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useLocation } from '../routes';
import { back } from '../routes/history';

function BackButton() {
	const location = useLocation();
	const isTemplatePart = location.params.postType === 'wp_template_part';
	const previousTemplateId = location.state?.fromTemplateId;

	if ( ! isTemplatePart || ! previousTemplateId ) {
		return null;
	}

	return (
		<Button
			className="edit-site-visual-editor__back-button"
			icon={ arrowLeft }
			onClick={ () => {
				back();
			} }
		>
			{ __( 'Back' ) }
		</Button>
	);
}

export default BackButton;

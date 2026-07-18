import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalShellProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    /** Tailwind z-index class for the overlay, e.g. "z-[1002]" */
    zIndexClassName: string;
    /** Inline background color for the overlay, e.g. "rgba(0,0,0,0.75)" */
    overlayBackground: string;
    /** Inline backdrop-filter value for the overlay, e.g. "blur(12px)" */
    overlayBlur: string;
    /** Full className string applied to the animated card */
    cardClassName: string;
    /** Spring transition duration for the card animation */
    springDuration?: number;
    /** Spring transition bounce for the card animation */
    springBounce?: number;
    /** Whether clicking the overlay (outside the card) closes the modal. Default true. */
    closeOnOverlayClick?: boolean;
    /** Optional ref forwarded to the card element (e.g. for click-outside detection) */
    cardRef?: React.Ref<HTMLDivElement>;
}

/**
 * Shared overlay + animated card shell used by the app's modal-style popups
 * (AiPaymentPopup, CoffeeGatePopup, BecomeHostWarningPopup). Extracted to avoid
 * duplicating the same framer-motion overlay/card structure in every popup.
 */
const ModalShell: React.FC<ModalShellProps> = ({
    isOpen,
    onClose,
    children,
    zIndexClassName,
    overlayBackground,
    overlayBlur,
    cardClassName,
    springDuration = 0.4,
    springBounce = 0.25,
    closeOnOverlayClick = true,
    cardRef,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4`}
                    style={{ background: overlayBackground, backdropFilter: overlayBlur }}
                    onClick={closeOnOverlayClick ? onClose : undefined}
                >
                    <motion.div
                        ref={cardRef}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: springDuration, bounce: springBounce }}
                        className={cardClassName}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ModalShell;

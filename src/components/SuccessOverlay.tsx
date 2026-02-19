import { motion } from 'framer-motion';

interface SuccessOverlayProps {
    message: string;
}

export default function SuccessOverlay({ message }: SuccessOverlayProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream/95 backdrop-blur-sm"
        >
            {/* Spinning loader ring */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8"
            >
                <div className="w-12 h-12 border-[2.5px] border-charcoal/10 border-t-charcoal rounded-full animate-spin" />
            </motion.div>

            {/* Success message */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="text-[14px] tracking-[0.15em] uppercase text-charcoal/70 font-medium"
            >
                {message}
            </motion.p>
        </motion.div>
    );
}

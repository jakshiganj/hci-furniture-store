import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    // Simple logic for showing page numbers with dots if needed
    // For now, let's keep it simple as the catalog is likely not huge.
    // We can enhance this later if there are hundreds of pages.

    return (
        <div className="flex items-center justify-center gap-2 mt-12 lg:mt-16">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-full border border-stone-light transition-all duration-300 ${
                    currentPage === 1 
                        ? 'opacity-30 cursor-not-allowed' 
                        : 'text-charcoal hover:bg-charcoal hover:text-white hover:border-charcoal'
                }`}
                aria-label="Previous page"
            >
                <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-10 h-10 flex items-center justify-center text-[13px] font-medium transition-all duration-300 rounded-full ${
                            currentPage === page
                                ? 'bg-sage text-white shadow-md shadow-sage/20'
                                : 'text-charcoal/60 hover:bg-stone-light/50'
                        }`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-full border border-stone-light transition-all duration-300 ${
                    currentPage === totalPages 
                        ? 'opacity-30 cursor-not-allowed' 
                        : 'text-charcoal hover:bg-charcoal hover:text-white hover:border-charcoal'
                }`}
                aria-label="Next page"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

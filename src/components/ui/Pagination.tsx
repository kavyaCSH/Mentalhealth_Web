import React from 'react';
import ReactPaginate from 'react-paginate';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (count: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange
}) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageClick = (selectedItem: { selected: number }) => {
        // react-paginate uses 0-indexed page numbers, our component uses 1-indexed
        onPageChange(selectedItem.selected + 1);
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-5 border-t border-border-card bg-card gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <p className="text-xs font-bold text-muted whitespace-nowrap">
                    Showing <span className="text-main">{startItem}</span> to{' '}
                    <span className="text-main">{endItem}</span> of{' '}
                    <span className="text-main">{totalItems}</span> entries
                </p>

                {onItemsPerPageChange && totalItems > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Per Page:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="bg-page/50 border border-border-card rounded-xl px-4 py-2 text-[10px] font-black text-main outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer hover:bg-page"
                        >
                            {Array.from(new Set([
                                5, 10,
                                ...[25, 50, 75, 100].map(p => Math.max(1, Math.round((p / 100) * totalItems)))
                            ])).sort((a, b) => a - b).map(count => (
                                <option key={count} value={count}>
                                    {count}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <ReactPaginate
                    breakLabel="..."
                    nextLabel={
                        <span className="flex items-center gap-1">
                            Next <ChevronRight size={14} />
                        </span>
                    }
                    previousLabel={
                        <span className="flex items-center gap-1">
                            <ChevronLeft size={14} /> Prev
                        </span>
                    }
                    onPageChange={handlePageClick}
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={1}
                    pageCount={totalPages}
                    forcePage={currentPage > 0 ? currentPage - 1 : 0}
                    
                    // Container & general formatting
                    containerClassName="flex items-center gap-1 text-xs font-bold"
                    
                    // Page links
                    pageClassName="rounded-lg hover:bg-page transition-colors"
                    pageLinkClassName="w-8 h-8 flex items-center justify-center text-muted outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                    
                    // Active page styling
                    activeClassName="bg-indigo-500/10"
                    activeLinkClassName="text-indigo-500 cursor-default"
                    
                    // Previous/Next buttons
                    previousClassName="mr-2"
                    nextClassName="ml-2"
                    previousLinkClassName="px-3 py-1.5 flex items-center justify-center text-muted hover:text-indigo-500 hover:bg-page rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors uppercase tracking-widest text-[10px] font-black"
                    nextLinkClassName="px-3 py-1.5 flex items-center justify-center text-muted hover:text-indigo-500 hover:bg-page rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors uppercase tracking-widest text-[10px] font-black"
                    
                    // Disabled states
                    disabledClassName="opacity-50 pointer-events-none"
                    
                    // Break styling
                    breakClassName="flex items-center justify-center text-muted w-8"
                />
            )}
        </div>
    );
};

export default Pagination;

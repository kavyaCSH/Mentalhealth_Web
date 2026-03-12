import React from 'react';
import ReactPaginate from 'react-paginate';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageClick = (selectedItem: { selected: number }) => {
        // react-paginate uses 0-indexed page numbers, our component uses 1-indexed
        onPageChange(selectedItem.selected + 1);
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-5 border-t border-slate-100 bg-white gap-4">
            <p className="text-xs font-bold text-slate-500">
                Showing <span className="text-slate-900">{totalItems === 0 ? 0 : startItem}</span> to{' '}
                <span className="text-slate-900">{endItem}</span> of{' '}
                <span className="text-slate-900">{totalItems}</span> entries
            </p>
            
            {totalPages > 0 && (
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
                    pageClassName="rounded-lg hover:bg-slate-50 transition-colors"
                    pageLinkClassName="w-8 h-8 flex items-center justify-center text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                    
                    // Active page styling
                    activeClassName="bg-indigo-50"
                    activeLinkClassName="text-indigo-600 cursor-default"
                    
                    // Previous/Next buttons
                    previousClassName="mr-2"
                    nextClassName="ml-2"
                    previousLinkClassName="px-3 py-1.5 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors uppercase tracking-widest text-[10px] font-black"
                    nextLinkClassName="px-3 py-1.5 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors uppercase tracking-widest text-[10px] font-black"
                    
                    // Disabled states
                    disabledClassName="opacity-50 pointer-events-none"
                    
                    // Break styling
                    breakClassName="flex items-center justify-center text-slate-400 w-8"
                />
            )}
        </div>
    );
};

export default Pagination;

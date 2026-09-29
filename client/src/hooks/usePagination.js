import { useState } from 'react';

/**
 * Handle state for lists pagination
 * @param {number} initialLimit 
 */
const usePagination = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const pagesCount = Math.ceil(total / limit) || 1;

  const goToNextPage = () => {
    setPage(p => Math.min(p + 1, pagesCount));
  };

  const goToPrevPage = () => {
    setPage(p => Math.max(p - 1, 1));
  };

  return {
    page,
    limit,
    total,
    pages: pagesCount,
    setPage,
    setLimit,
    setTotal,
    nextPage: goToNextPage,
    prevPage: goToPrevPage
  };
};

export default usePagination;

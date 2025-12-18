export const getNow = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const params = new URLSearchParams(window.location.search);
    const mockTime = params.get('mockTime');
    if (mockTime) {
        const date = new Date(mockTime);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
  }
  return new Date();
};

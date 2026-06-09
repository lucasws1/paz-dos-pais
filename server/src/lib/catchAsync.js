/**
 * Envolve um controller async para que erros não capturados
 * sejam encaminhados ao error handler global do Express.
 */
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

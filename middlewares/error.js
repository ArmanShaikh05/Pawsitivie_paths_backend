class ErrorHandler extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
  
  export const ErrorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";
    err.statusCode = err.statusCode || 500;
  
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  };
  
  export default ErrorHandler;
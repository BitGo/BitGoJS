"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportsCoin = exports.ApiNotImplementedError = void 0;
class ApiNotImplementedError extends Error {
    constructor(coinName) {
        super(`api not implemented for coin ${coinName}`);
    }
}
exports.ApiNotImplementedError = ApiNotImplementedError;
function supportsCoin(builder, coinName) {
    try {
        builder.forCoin(coinName);
        return true;
    }
    catch (e) {
        if (e instanceof ApiNotImplementedError) {
            return false;
        }
        throw e;
    }
}
exports.supportsCoin = supportsCoin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBpQnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BcGlCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBLE1BQWEsc0JBQXVCLFNBQVEsS0FBSztJQUMvQyxZQUFZLFFBQWdCO1FBQzFCLEtBQUssQ0FBQyxnQ0FBZ0MsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFKRCx3REFJQztBQU9ELFNBQWdCLFlBQVksQ0FBQyxPQUE0QixFQUFFLFFBQWdCO0lBQ3pFLElBQUk7UUFDRixPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxZQUFZLHNCQUFzQixFQUFFO1lBQ3ZDLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxNQUFNLENBQUMsQ0FBQztLQUNUO0FBQ0gsQ0FBQztBQVZELG9DQVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVXR4b0FwaSB9IGZyb20gJy4vVXR4b0FwaSc7XG5pbXBvcnQgeyBIdHRwQ2xpZW50IH0gZnJvbSAnLi9CYXNlSHR0cENsaWVudCc7XG5cbmV4cG9ydCBjbGFzcyBBcGlOb3RJbXBsZW1lbnRlZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcihjb2luTmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYGFwaSBub3QgaW1wbGVtZW50ZWQgZm9yIGNvaW4gJHtjb2luTmFtZX1gKTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFwaUJ1aWxkZXI8VD4ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGZvckNvaW4oY29pbk5hbWU6IHN0cmluZywgcGFyYW1zPzogeyBodHRwQ2xpZW50PzogSHR0cENsaWVudCB9KTogVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN1cHBvcnRzQ29pbihidWlsZGVyOiBBcGlCdWlsZGVyPFV0eG9BcGk+LCBjb2luTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgYnVpbGRlci5mb3JDb2luKGNvaW5OYW1lKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgQXBpTm90SW1wbGVtZW50ZWRFcnJvcikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aHJvdyBlO1xuICB9XG59XG4iXX0=
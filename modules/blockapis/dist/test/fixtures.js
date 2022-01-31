"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFixture = exports.getFixtureString = void 0;
const fs = require("fs/promises");
async function getFixtureString(path, defaultValue) {
    try {
        return await fs.readFile(path, 'utf8');
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            if (!defaultValue) {
                throw new Error(`no default value provided`);
            }
            await fs.writeFile(path, defaultValue, 'utf8');
            throw new Error(`wrote default value for ${path}`);
        }
        throw e;
    }
}
exports.getFixtureString = getFixtureString;
async function getFixture(path, defaultValue) {
    return JSON.parse(await getFixtureString(path, defaultValue ? JSON.stringify(defaultValue, null, 2) : undefined));
}
exports.getFixture = getFixture;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4dHVyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L2ZpeHR1cmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGtDQUFrQztBQUUzQixLQUFLLFVBQVUsZ0JBQWdCLENBQUMsSUFBWSxFQUFFLFlBQXFCO0lBQ3hFLElBQUk7UUFDRixPQUFPLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDeEM7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUssQ0FBUyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDaEMsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2FBQzlDO1lBQ0QsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNwRDtRQUNELE1BQU0sQ0FBQyxDQUFDO0tBQ1Q7QUFDSCxDQUFDO0FBYkQsNENBYUM7QUFFTSxLQUFLLFVBQVUsVUFBVSxDQUFJLElBQVksRUFBRSxZQUFnQjtJQUNoRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDcEgsQ0FBQztBQUZELGdDQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMvcHJvbWlzZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Rml4dHVyZVN0cmluZyhwYXRoOiBzdHJpbmcsIGRlZmF1bHRWYWx1ZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IGZzLnJlYWRGaWxlKHBhdGgsICd1dGY4Jyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoKGUgYXMgYW55KS5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgaWYgKCFkZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBubyBkZWZhdWx0IHZhbHVlIHByb3ZpZGVkYCk7XG4gICAgICB9XG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGUocGF0aCwgZGVmYXVsdFZhbHVlLCAndXRmOCcpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGB3cm90ZSBkZWZhdWx0IHZhbHVlIGZvciAke3BhdGh9YCk7XG4gICAgfVxuICAgIHRocm93IGU7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEZpeHR1cmU8VD4ocGF0aDogc3RyaW5nLCBkZWZhdWx0VmFsdWU/OiBUKTogUHJvbWlzZTxUPiB7XG4gIHJldHVybiBKU09OLnBhcnNlKGF3YWl0IGdldEZpeHR1cmVTdHJpbmcocGF0aCwgZGVmYXVsdFZhbHVlID8gSlNPTi5zdHJpbmdpZnkoZGVmYXVsdFZhbHVlLCBudWxsLCAyKSA6IHVuZGVmaW5lZCkpO1xufVxuIl19
import { __awaiter, __generator } from "tslib";
import * as sqlite from "sqlite3";
import * as util from "util";
import { THINGS_DB_PATH } from "./constants";
// async function getTasksFromThingsDb(): Promise<Task[]> {
function getTasksFromThingsDb() {
    return __awaiter(this, void 0, void 0, function () {
        var dbPath, thingsDb;
        return __generator(this, function (_a) {
            dbPath = THINGS_DB_PATH.replace("~", "/Users/liam");
            console.log("db", dbPath);
            thingsDb = new sqlite.Database(dbPath, sqlite.OPEN_READONLY);
            return [2 /*return*/, util.promisify(thingsDb.each)("\n    SELECT\n        TMTask.uuid as uuid,\n        TMTask.title as title,\n        TMTask.notes as notes,\n        TMTask.project as project,\n        TMTask.startDate startDate,\n        TMTask.stopDate as stopDate,\n        TMChecklistItem.title AS subtask\n    FROM\n        TMChecklistItem,\n        TMTask\n    WHERE\n        TMTask.trashed = 0 \n        AND TMTask.stopDate IS NOT NULL \n        AND TMTask.uuid = TMChecklistItem.task\n    ORDER BY\n        TMTask.stopDate\n        ")];
        });
    });
}
export function getTasksFromThingsLogbook() {
    return __awaiter(this, void 0, void 0, function () {
        var completedTasks, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getTasksFromThingsDb()];
                case 1:
                    completedTasks = _a.sent();
                    return [2 /*return*/, completedTasks];
                case 2:
                    err_1 = _a.sent();
                    console.error("[Things Logbook] Failed to query the Things SQLite DB", err_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGhpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUU3QixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBd0I3QywyREFBMkQ7QUFDM0QsU0FBZSxvQkFBb0I7Ozs7WUFFM0IsTUFBTSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXBCLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVuRSxzQkFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FDbEMsNGVBa0JLLENBQ04sRUFBQzs7O0NBSUg7QUFFRCxNQUFNLFVBQWdCLHlCQUF5Qjs7Ozs7OztvQkFFcEIscUJBQU0sb0JBQW9CLEVBQUUsRUFBQTs7b0JBQTdDLGNBQWMsR0FBRyxTQUE0QjtvQkFDbkQsc0JBQU8sY0FBYyxFQUFDOzs7b0JBRXRCLE9BQU8sQ0FBQyxLQUFLLENBQUMsdURBQXVELEVBQUUsS0FBRyxDQUFDLENBQUM7Ozs7OztDQUUvRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNxbGl0ZSBmcm9tIFwic3FsaXRlM1wiO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tIFwidXRpbFwiO1xuXG5pbXBvcnQgeyBUSElOR1NfREJfUEFUSCB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1YlRhc2sge1xuICB0aXRsZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2sge1xuICB1dWlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIG5vdGVzOiBzdHJpbmc7XG4gIHByb2plY3Q6IHN0cmluZztcbiAgc3RhcnREYXRlOiBudW1iZXI7XG4gIHN0b3BEYXRlOiBudW1iZXI7XG4gIHN1YnRhc2tzOiBTdWJUYXNrW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFza01hcCB7XG4gIFtrZXk6IHN0cmluZ106IFRhc2s7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0ZVRvVGFza01hcCB7XG4gIFtrZXk6IHN0cmluZ106IFRhc2tNYXA7XG59XG5cbi8vIGFzeW5jIGZ1bmN0aW9uIGdldFRhc2tzRnJvbVRoaW5nc0RiKCk6IFByb21pc2U8VGFza1tdPiB7XG5hc3luYyBmdW5jdGlvbiBnZXRUYXNrc0Zyb21UaGluZ3NEYigpOiBQcm9taXNlPGFueT4ge1xuICAvLyBjb25zdCBkYlBhdGggPSAoVEhJTkdTX0RCX1BBVEgucmVwbGFjZShcIn5cIiwgb3MuaG9tZWRpcigpKTtcbiAgY29uc3QgZGJQYXRoID0gVEhJTkdTX0RCX1BBVEgucmVwbGFjZShcIn5cIiwgXCIvVXNlcnMvbGlhbVwiKTtcbiAgY29uc29sZS5sb2coXCJkYlwiLCBkYlBhdGgpO1xuXG4gIGNvbnN0IHRoaW5nc0RiID0gbmV3IHNxbGl0ZS5EYXRhYmFzZShkYlBhdGgsIHNxbGl0ZS5PUEVOX1JFQURPTkxZKTtcblxuICByZXR1cm4gdXRpbC5wcm9taXNpZnkodGhpbmdzRGIuZWFjaCkoXG4gICAgYFxuICAgIFNFTEVDVFxuICAgICAgICBUTVRhc2sudXVpZCBhcyB1dWlkLFxuICAgICAgICBUTVRhc2sudGl0bGUgYXMgdGl0bGUsXG4gICAgICAgIFRNVGFzay5ub3RlcyBhcyBub3RlcyxcbiAgICAgICAgVE1UYXNrLnByb2plY3QgYXMgcHJvamVjdCxcbiAgICAgICAgVE1UYXNrLnN0YXJ0RGF0ZSBzdGFydERhdGUsXG4gICAgICAgIFRNVGFzay5zdG9wRGF0ZSBhcyBzdG9wRGF0ZSxcbiAgICAgICAgVE1DaGVja2xpc3RJdGVtLnRpdGxlIEFTIHN1YnRhc2tcbiAgICBGUk9NXG4gICAgICAgIFRNQ2hlY2tsaXN0SXRlbSxcbiAgICAgICAgVE1UYXNrXG4gICAgV0hFUkVcbiAgICAgICAgVE1UYXNrLnRyYXNoZWQgPSAwIFxuICAgICAgICBBTkQgVE1UYXNrLnN0b3BEYXRlIElTIE5PVCBOVUxMIFxuICAgICAgICBBTkQgVE1UYXNrLnV1aWQgPSBUTUNoZWNrbGlzdEl0ZW0udGFza1xuICAgIE9SREVSIEJZXG4gICAgICAgIFRNVGFzay5zdG9wRGF0ZVxuICAgICAgICBgXG4gICk7XG5cbiAgLy8gZm9yIGVhY2ggZGF5IGluIE1BUF9EQVlfVE9fVEFTS1MsIGlmIFlZWVktTU0tZGQubWQgZXhpc3RzLCBwcmVwZW5kIGl0IHNvbWVob3cuIG90aGVyd2lzZSwgY3JlYXRlIG5ldyBub3RlIHdpdGggbGlzdCBhdCB0b3AuXG4gIC8vIHVzZSB0aGlzLmFwcC5tZXRkYXRhQ2FjaGUubWV0YWRhdGFDYWNoZS48aGFzaD4uaGVhZGluZ3Ncbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFRhc2tzRnJvbVRoaW5nc0xvZ2Jvb2soKTogUHJvbWlzZTxUYXNrW10+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb21wbGV0ZWRUYXNrcyA9IGF3YWl0IGdldFRhc2tzRnJvbVRoaW5nc0RiKCk7XG4gICAgcmV0dXJuIGNvbXBsZXRlZFRhc2tzO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiW1RoaW5ncyBMb2dib29rXSBGYWlsZWQgdG8gcXVlcnkgdGhlIFRoaW5ncyBTUUxpdGUgREJcIiwgZXJyKTtcbiAgfVxufVxuIl19
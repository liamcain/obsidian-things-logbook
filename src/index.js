import { __awaiter, __extends, __generator } from "tslib";
import { Plugin } from "obsidian";
// import {
//   createDailyNote,
//   getDailyNote,
//   getAllDailyNotes,
// } from "obsidian-daily-notes-interface";
import { getTasksFromThingsLogbook } from "./things";
var ThingsLogbookPlugin = /** @class */ (function (_super) {
  __extends(ThingsLogbookPlugin, _super);
  function ThingsLogbookPlugin() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  ThingsLogbookPlugin.prototype.onload = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        this.addCommand({
          id: "show-calendar-view",
          name: "Open view",
          callback: this.syncLogbook.bind(this),
        });
        return [2 /*return*/];
      });
    });
  };
  ThingsLogbookPlugin.prototype.syncLogbook = function () {
    return __awaiter(this, void 0, void 0, function () {
      var tasks;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, getTasksFromThingsLogbook()];
          case 1:
            tasks = _a.sent();
            // const daysToTasks: Record<string, Task[]> = {};
            console.log("tasks", tasks);
            return [2 /*return*/];
        }
      });
    });
  };
  return ThingsLogbookPlugin;
})(Plugin);
export default ThingsLogbookPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsT0FBTyxFQUFPLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUN2QyxXQUFXO0FBQ1gscUJBQXFCO0FBQ3JCLGtCQUFrQjtBQUNsQixzQkFBc0I7QUFDdEIsMkNBQTJDO0FBRTNDLE9BQU8sRUFBRSx5QkFBeUIsRUFBUSxNQUFNLFlBQVksQ0FBQztBQVM3RDtJQUFpRCx1Q0FBTTtJQUF2RDs7SUFtRUEsQ0FBQztJQWxFTyxvQ0FBTSxHQUFaOzs7Z0JBQ0UsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDZCxFQUFFLEVBQUUsb0JBQW9CO29CQUN4QixJQUFJLEVBQUUsV0FBVztvQkFDakIsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztpQkFDdEMsQ0FBQyxDQUFDOzs7O0tBQ0o7SUFFSyx5Q0FBVyxHQUFqQjs7Ozs7NEJBRXdCLHFCQUFNLHlCQUF5QixFQUFFLEVBQUE7O3dCQUFqRCxLQUFLLEdBQVcsU0FBaUM7d0JBQ3ZELGtEQUFrRDt3QkFFbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7Ozs7O0tBb0Q3QjtJQUNILDBCQUFDO0FBQUQsQ0FBQyxBQW5FRCxDQUFpRCxNQUFNLEdBbUV0RCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIG1vbWVudCBmcm9tIFwibW9tZW50XCI7XG5pbXBvcnQgeyBBcHAsIFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuLy8gaW1wb3J0IHtcbi8vICAgY3JlYXRlRGFpbHlOb3RlLFxuLy8gICBnZXREYWlseU5vdGUsXG4vLyAgIGdldEFsbERhaWx5Tm90ZXMsXG4vLyB9IGZyb20gXCJvYnNpZGlhbi1kYWlseS1ub3Rlcy1pbnRlcmZhY2VcIjtcblxuaW1wb3J0IHsgZ2V0VGFza3NGcm9tVGhpbmdzTG9nYm9vaywgVGFzayB9IGZyb20gXCJzcmMvdGhpbmdzXCI7XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgYXBwOiBBcHA7XG4gICAgbW9tZW50OiB0eXBlb2YgbW9tZW50O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRoaW5nc0xvZ2Jvb2tQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcInNob3ctY2FsZW5kYXItdmlld1wiLFxuICAgICAgbmFtZTogXCJPcGVuIHZpZXdcIixcbiAgICAgIGNhbGxiYWNrOiB0aGlzLnN5bmNMb2dib29rLmJpbmQodGhpcyksXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzeW5jTG9nYm9vaygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBjb25zdCBkYWlseU5vdGVzID0gZ2V0QWxsRGFpbHlOb3RlcygpO1xuICAgIGNvbnN0IHRhc2tzOiBUYXNrW10gPSBhd2FpdCBnZXRUYXNrc0Zyb21UaGluZ3NMb2dib29rKCk7XG4gICAgLy8gY29uc3QgZGF5c1RvVGFza3M6IFJlY29yZDxzdHJpbmcsIFRhc2tbXT4gPSB7fTtcblxuICAgIGNvbnNvbGUubG9nKFwidGFza3NcIiwgdGFza3MpO1xuXG4gICAgLy8gdGFza3MuZm9yRWFjaCgodGFzazogVGFzaykgPT4ge1xuICAgIC8vICAgY29uc3Qgc3RvcERhdGUgPSB3aW5kb3cubW9tZW50KHRhc2suc3RvcERhdGUgKiAxMDAwKTtcblxuICAgIC8vICAgY29uc3Qga2V5ID0gc3RvcERhdGUuZm9ybWF0KCk7XG5cbiAgICAvLyAgIGlmIChkYXlzVG9UYXNrc1trZXldKSB7XG4gICAgLy8gICAgIGRheXNUb1Rhc2tzW2tleV0ucHVzaCh0YXNrKTtcbiAgICAvLyAgIH0gZWxzZSB7XG4gICAgLy8gICAgIGRheXNUb1Rhc2tzW2tleV0gPSBbdGFza107XG4gICAgLy8gICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyBPYmplY3QuZW50cmllcyhkYXlzVG9UYXNrcykuZm9yRWFjaChhc3luYyAoW2RhdGVTdHIsIF90YXNrc10pID0+IHtcbiAgICAvLyAgIGNvbnN0IGRhdGUgPSB3aW5kb3cubW9tZW50KGRhdGVTdHIpO1xuXG4gICAgLy8gICBsZXQgZGFpbHlOb3RlID0gZ2V0RGFpbHlOb3RlKGRhdGUsIGRhaWx5Tm90ZXMpO1xuICAgIC8vICAgaWYgKCFkYWlseU5vdGUpIHtcbiAgICAvLyAgICAgZGFpbHlOb3RlID0gYXdhaXQgY3JlYXRlRGFpbHlOb3RlKGRhdGUpO1xuICAgIC8vICAgfVxuXG4gICAgLy8gICBjb25zdCByZW5kZXJlZFRhc2tzID0gXCJSRU5ERVJFRF9UQVNLU1wiOyAvLyBUT0RPXG5cbiAgICAvLyAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZGFpbHlOb3RlKTtcblxuICAgIC8vICAgY29uc3Qgc2VjdGlvbklkeCA9IG1ldGFkYXRhLmhlYWRpbmdzLmZpbmRJbmRleChcbiAgICAvLyAgICAgKG1ldGEpID0+IG1ldGEuaGVhZGluZyA9PT0gXCJMb2dib29rXCJcbiAgICAvLyAgICk7XG4gICAgLy8gICAvLyBUT0RPIHRoaXMgc2hvdWxkIHRha2UgaW50byBhY2NvdW50IGxldmVsXG5cbiAgICAvLyAgIGNvbnN0IGZpbGVMaW5lcyA9IChhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGRhaWx5Tm90ZSkpLnNwbGl0KFwiXFxuXCIpO1xuXG4gICAgLy8gICAvLyBTZWN0aW9uIGFscmVhZHkgZXhpc3RzLCBqdXN0IHJlcGxhY2VcbiAgICAvLyAgIGlmIChzZWN0aW9uSWR4ICE9PSAtMSkge1xuICAgIC8vICAgICBjb25zdCBzdGFydCA9IG1ldGFkYXRhLmhlYWRpbmdzW3NlY3Rpb25JZHhdLnBvc2l0aW9uLnN0YXJ0O1xuICAgIC8vICAgICBjb25zdCBlbmQgPSBtZXRhZGF0YS5oZWFkaW5nc1tzZWN0aW9uSWR4XS5wb3NpdGlvbi5zdGFydDtcblxuICAgIC8vICAgICBjb25zdCBwcmVmaXggPSBmaWxlTGluZXMuc2xpY2UoMCwgc3RhcnQubGluZSk7XG4gICAgLy8gICAgIGNvbnN0IHN1ZmZpeCA9IGZpbGVMaW5lcy5zbGljZShlbmQubGluZSk7XG5cbiAgICAvLyAgICAgdGhpcy5hcHAudmF1bHQubW9kaWZ5KFxuICAgIC8vICAgICAgIGRhaWx5Tm90ZSxcbiAgICAvLyAgICAgICBbcHJlZml4LCByZW5kZXJlZFRhc2tzLCBzdWZmaXhdLmpvaW4oXCJcXG5cIilcbiAgICAvLyAgICAgKTtcbiAgICAvLyAgIH0gZWxzZSB7XG4gICAgLy8gICAgIHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShcbiAgICAvLyAgICAgICBkYWlseU5vdGUsXG4gICAgLy8gICAgICAgWy4uLmZpbGVMaW5lcywgXCJcXG5cIiwgcmVuZGVyZWRUYXNrc10uam9pbihcIlxcblwiKVxuICAgIC8vICAgICApO1xuICAgIC8vICAgfVxuICAgIC8vIH0pO1xuICB9XG59XG4iXX0=

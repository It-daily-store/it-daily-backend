"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
        this.total = 0;
    }
    search(searchableFields) {
        var _a, _b;
        if ((_a = this.query) === null || _a === void 0 ? void 0 : _a.searchTerm) {
            this.modelQuery = (_b = this === null || this === void 0 ? void 0 : this.modelQuery) === null || _b === void 0 ? void 0 : _b.find({
                $or: searchableFields.map((field) => {
                    var _a;
                    return ({
                        [field]: { $regex: (_a = this.query) === null || _a === void 0 ? void 0 : _a.searchTerm, $options: "i" },
                    });
                }),
            });
        }
        return this;
    }
    filter(excludeFields) {
        const queryObj = Object.assign({}, this.query);
        excludeFields.forEach((el) => delete queryObj[el]);
        this.modelQuery = this.modelQuery.find(queryObj);
        return this;
    }
    sort() {
        var _a;
        const sort = ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.sort) || "-createdAt";
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    countTotal() {
        return __awaiter(this, void 0, void 0, function* () {
            this.total = yield this.modelQuery.clone().countDocuments();
            this.modelQuery = this.modelQuery;
            return this;
        });
    }
    paginate() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const limit = ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.limit) ? Number((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.limit) : 10;
            const page = ((_c = this === null || this === void 0 ? void 0 : this.query) === null || _c === void 0 ? void 0 : _c.page) ? Number((_d = this === null || this === void 0 ? void 0 : this.query) === null || _d === void 0 ? void 0 : _d.page) : 1;
            const skip = (page - 1) * limit;
            yield this.countTotal();
            this.modelQuery = this === null || this === void 0 ? void 0 : this.modelQuery.skip(skip).limit(limit);
            return this;
        });
    }
    fields() {
        var _a;
        const fields = ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.fields)
            ? this.query.fields.split(",").join(" ")
            : "-__v";
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
}
exports.default = QueryBuilder;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFullName = void 0;
const makeFullName = (name) => {
    const { firstName, middleName, lastName } = name;
    return [firstName, middleName, lastName].filter(Boolean).join(" ");
};
exports.makeFullName = makeFullName;

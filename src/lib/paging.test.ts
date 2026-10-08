import assert from "node:assert/strict";
import test from "node:test";
import { PAGE_SIZE, readPage } from "./paging";

test("an empty list is one empty page", () => {
  assert.deepEqual(readPage(undefined, 0), { page: 1, pageCount: 1, skip: 0, take: PAGE_SIZE });
});

test("the page param picks the rows to skip", () => {
  assert.deepEqual(readPage("2", 25), { page: 2, pageCount: 3, skip: PAGE_SIZE, take: PAGE_SIZE });
});

test("a page past the end, below one or not a number falls back inside the range", () => {
  assert.equal(readPage("99", 25).page, 3);
  assert.equal(readPage("0", 25).page, 1);
  assert.equal(readPage("-4", 25).page, 1);
  assert.equal(readPage("abc", 25).page, 1);
});

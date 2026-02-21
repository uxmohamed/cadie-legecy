/**
 * Tests for billing entitlements — confirms the correct limits per plan tier.
 */

import {
  getEntitlements,
  isNearStarterLimit,
  LIMIT_WARNING_THRESHOLD,
  PLAN_ENTITLEMENTS,
} from "@/lib/billing/entitlements";

const MB = 1024 * 1024;

describe("PLAN_ENTITLEMENTS", () => {
  describe("starter", () => {
    const e = PLAN_ENTITLEMENTS.starter;

    it("caps saved items at 100", () => expect(e.maxSavedItems).toBe(100));
    it("caps spaces at 3", () => expect(e.maxSpaces).toBe(3));
    it("caps images at 25", () => expect(e.maxImages).toBe(25));
    it("caps documents at 25", () => expect(e.maxDocuments).toBe(25));
    it("sets image file size to 10MB", () => expect(e.maxImageFileBytes).toBe(10 * MB));
    it("sets document file size to 10MB", () => expect(e.maxDocumentFileBytes).toBe(10 * MB));
    it("disables bookmark import", () => expect(e.bookmarkImportEnabled).toBe(false));
    it("sets import file size to 0 (disabled)", () => expect(e.maxImportFileBytes).toBe(0));
  });

  describe("pro", () => {
    const e = PLAN_ENTITLEMENTS.pro;

    it("has no saved items cap (null)", () => expect(e.maxSavedItems).toBeNull());
    it("has no spaces cap (null)", () => expect(e.maxSpaces).toBeNull());
    it("caps images at 2000", () => expect(e.maxImages).toBe(2000));
    it("caps documents at 2000", () => expect(e.maxDocuments).toBe(2000));
    it("sets image file size to 25MB", () => expect(e.maxImageFileBytes).toBe(25 * MB));
    it("sets document file size to 25MB", () => expect(e.maxDocumentFileBytes).toBe(25 * MB));
    it("enables bookmark import", () => expect(e.bookmarkImportEnabled).toBe(true));
    it("sets import file size to 50MB", () => expect(e.maxImportFileBytes).toBe(50 * MB));
  });

  describe("believer", () => {
    const e = PLAN_ENTITLEMENTS.believer;

    it("has identical entitlements to pro for saved items", () => expect(e.maxSavedItems).toBe(PLAN_ENTITLEMENTS.pro.maxSavedItems));
    it("has identical entitlements to pro for spaces", () => expect(e.maxSpaces).toBe(PLAN_ENTITLEMENTS.pro.maxSpaces));
    it("has identical entitlements to pro for images", () => expect(e.maxImages).toBe(PLAN_ENTITLEMENTS.pro.maxImages));
    it("has identical entitlements to pro for documents", () => expect(e.maxDocuments).toBe(PLAN_ENTITLEMENTS.pro.maxDocuments));
    it("has identical file size limits to pro", () => {
      expect(e.maxImageFileBytes).toBe(PLAN_ENTITLEMENTS.pro.maxImageFileBytes);
      expect(e.maxDocumentFileBytes).toBe(PLAN_ENTITLEMENTS.pro.maxDocumentFileBytes);
    });
    it("enables bookmark import", () => expect(e.bookmarkImportEnabled).toBe(true));
  });
});

describe("getEntitlements", () => {
  it("returns correct entitlements for starter", () => {
    expect(getEntitlements("starter")).toEqual(PLAN_ENTITLEMENTS.starter);
  });

  it("returns correct entitlements for pro", () => {
    expect(getEntitlements("pro")).toEqual(PLAN_ENTITLEMENTS.pro);
  });

  it("returns correct entitlements for believer", () => {
    expect(getEntitlements("believer")).toEqual(PLAN_ENTITLEMENTS.believer);
  });
});

describe("isNearStarterLimit", () => {
  it("returns false when well below the threshold", () => {
    expect(isNearStarterLimit(0)).toBe(false);
    expect(isNearStarterLimit(50)).toBe(false);
    expect(isNearStarterLimit(79)).toBe(false);
  });

  it("returns true at the warning threshold (80)", () => {
    expect(isNearStarterLimit(LIMIT_WARNING_THRESHOLD)).toBe(true);
    expect(isNearStarterLimit(80)).toBe(true);
  });

  it("returns true between threshold and cap", () => {
    expect(isNearStarterLimit(85)).toBe(true);
    expect(isNearStarterLimit(99)).toBe(true);
  });

  it("returns false at the cap (100) — already at limit, not 'near'", () => {
    expect(isNearStarterLimit(100)).toBe(false);
  });

  it("returns false above the cap", () => {
    expect(isNearStarterLimit(110)).toBe(false);
  });
});

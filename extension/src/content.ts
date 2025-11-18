/**
 * Content script - runs on web pages
 * Future features:
 * - Capture selected text
 * - Detect images under cursor
 * - Extract code snippets
 */

console.log("Vault extension content script loaded");

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection()?.toString() || "";
    sendResponse({ selectedText });
  }
  
  return true; // Keep message channel open for async response
});

// Future: Add selection handlers, image detection, etc.


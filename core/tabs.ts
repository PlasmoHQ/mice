export const getActiveTabs = () =>
  chrome.tabs.query({
    active: true,
    currentWindow: true
  })

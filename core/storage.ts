import { useEffect, useRef, useState } from "react"

/**
 * This share storage between chrome storage and local storage.
 */
export class Storage {
  #secretSet: Set<string>
  constructor(secretKeys: string[] = []) {
    this.#secretSet = new Set(secretKeys)
  }

  /**
   * Sync the key/value between chrome storage and local storage.
   * @param key
   * @returns true if the value is changed.
   */
  sync = (key: string) =>
    new Promise((resolve) => {
      if (this.#secretSet.has(key) || !chrome?.storage) {
        resolve(false)
        return
      }

      const previousValue = localStorage.getItem(key)

      chrome.storage.sync.get(key, (s) => {
        const value = s[key] as string
        localStorage.setItem(key, value)
        resolve(value !== previousValue)
      })
    })

  /**
   * Get value from either local storage or chrome storage.
   */
  get = (key: string) =>
    new Promise<string>((resolve) => {
      // If chrome storage is not available, use localStorage
      if (!chrome?.storage) {
        resolve(localStorage.getItem(key))
      } else {
        chrome.storage.sync.get(key, (s) => {
          resolve(s[key])
        })
      }
    })

  set = (key: string, rawValue: string | any) =>
    new Promise<void>((resolve) => {
      const value =
        typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue)

      // If not a secret, we set it in localstorage as well
      if (!this.#secretSet[key]) {
        localStorage.setItem(key, value)
      }

      if (!chrome?.storage) {
        resolve(null)
      } else {
        chrome.storage.sync.set({ [key]: value }, resolve)
      }
    })
}

export const useStorage = (key: string, onInit?: (v: string) => void) => {
  const [value, set] = useState<string>("")

  const storageRef = useRef(new Storage())

  useEffect(() => {
    storageRef.current.get(key).then((v) => {
      set(v)
      onInit?.(v)
    })

    if (!chrome?.storage) {
      return
    }

    chrome.storage.onChanged.addListener((objs) => {
      if (objs[key] && objs[key].newValue !== value) {
        set(objs[key].newValue)
      }
    })
  }, [])

  return {
    value,
    // Set the render value
    set,
    // Save the value OR current rendering value into chrome storage
    save: (v?: string) => storageRef.current.set(key, v || value),
    // Store the value into chrome storage, then set its render state
    persist: (newValue: string) =>
      storageRef.current.set(key, newValue).then(() => set(newValue))
  }
}

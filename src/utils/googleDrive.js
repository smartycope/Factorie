export const SPREADSHEET_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"
const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client"
const GOOGLE_API_SCRIPT_URL = "https://apis.google.com/js/api.js"

let tokenClient = null
let tokenClientId = null
let hasAuthorizedSession = false
const scriptPromises = new Map()

export class GoogleDriveError extends Error {
  constructor(message, { code = null, status = null } = {}) {
    super(message)
    this.name = "GoogleDriveError"
    this.code = code
    this.status = status
  }
}

export function getGoogleDriveConfig(env = import.meta.env ?? {}) {
  return {
    clientId: env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "",
    apiKey: env.VITE_GOOGLE_API_KEY?.trim() ?? "",
    appId: env.VITE_GOOGLE_APP_ID?.trim() ?? "",
  }
}

export function isGoogleDriveConfigured(config = getGoogleDriveConfig()) {
  return Boolean(config.clientId && config.apiKey && config.appId)
}

function requireGoogleDriveConfig(config) {
  if (!isGoogleDriveConfigured(config))
    throw new GoogleDriveError(
      "Google Drive is not configured for this deployment.",
      { code: "not_configured" },
    )
}

function loadScript(src, isReady) {
  if (isReady()) return Promise.resolve()
  if (scriptPromises.has(src)) return scriptPromises.get(src)

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    const script = existing ?? document.createElement("script")
    const cleanup = () => {
      script.removeEventListener("load", onLoad)
      script.removeEventListener("error", onError)
    }
    const onLoad = () => {
      cleanup()
      if (isReady()) resolve()
      else reject(new GoogleDriveError("A Google Drive library did not initialize."))
    }
    const onError = () => {
      cleanup()
      scriptPromises.delete(src)
      reject(new GoogleDriveError("Unable to load a Google Drive library."))
    }
    script.addEventListener("load", onLoad)
    script.addEventListener("error", onError)
    if (!existing) {
      script.src = src
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })
  scriptPromises.set(src, promise)
  return promise
}

async function loadIdentityServices() {
  await loadScript(
    GIS_SCRIPT_URL,
    () => Boolean(window.google?.accounts?.oauth2),
  )
}

async function loadPicker() {
  await loadScript(GOOGLE_API_SCRIPT_URL, () => Boolean(window.gapi?.load))
  if (window.google?.picker) return
  await new Promise((resolve, reject) => {
    window.gapi.load("picker", {
      callback: resolve,
      onerror: () =>
        reject(new GoogleDriveError("Unable to initialize Google Picker.")),
      timeout: 10000,
      ontimeout: () =>
        reject(new GoogleDriveError("Google Picker took too long to load.")),
    })
  })
}

export async function authorizeGoogleDrive(
  config = getGoogleDriveConfig(),
) {
  requireGoogleDriveConfig(config)
  await loadIdentityServices()

  if (!tokenClient || tokenClientId !== config.clientId) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: DRIVE_SCOPE,
      callback: () => {},
    })
    tokenClientId = config.clientId
    hasAuthorizedSession = false
  }

  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response?.error || !response?.access_token) {
        reject(
          new GoogleDriveError(
            response?.error_description ||
              response?.error ||
              "Google did not return an access token.",
            { code: response?.error ?? "authorization_failed" },
          ),
        )
        return
      }
      if (
        typeof window.google.accounts.oauth2.hasGrantedAllScopes ===
          "function" &&
        !window.google.accounts.oauth2.hasGrantedAllScopes(
          response,
          DRIVE_SCOPE,
        )
      ) {
        reject(
          new GoogleDriveError(
            "Google Drive access was not granted.",
            { code: "scope_not_granted" },
          ),
        )
        return
      }
      hasAuthorizedSession = true
      resolve(response.access_token)
    }
    tokenClient.error_callback = (error) => {
      reject(
        new GoogleDriveError(
          error?.type === "popup_closed" ?
            "Google Drive authorization was cancelled."
          : "Unable to open Google Drive authorization.",
          { code: error?.type ?? "popup_failed" },
        ),
      )
    }
    tokenClient.requestAccessToken({
      prompt: hasAuthorizedSession ? "" : "consent",
    })
  })
}

export async function pickGoogleDriveSpreadsheet(
  accessToken,
  config = getGoogleDriveConfig(),
) {
  requireGoogleDriveConfig(config)
  await loadPicker()

  return new Promise((resolve, reject) => {
    const picker = window.google.picker
    const view = new picker.DocsView(picker.ViewId.DOCS)
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false)
      .setMimeTypes(SPREADSHEET_MIME_TYPE)
      .setMode(picker.DocsViewMode.LIST)

    let pickerInstance
    pickerInstance = new picker.PickerBuilder()
      .setAppId(config.appId)
      .setOAuthToken(accessToken)
      .setDeveloperKey(config.apiKey)
      .addView(view)
      .setCallback((data) => {
        const action = data[picker.Response.ACTION]
        if (action === picker.Action.ERROR) {
          console.error("Google Picker reported an error", data)
          pickerInstance?.setVisible(false)
          reject(
            new GoogleDriveError("Google Picker encountered an error.", {
              code: "picker_error",
            }),
          )
          return
        }
        if (action === picker.Action.CANCEL) {
          reject(
            new GoogleDriveError("Google Drive file selection was cancelled.", {
              code: "picker_cancelled",
            }),
          )
          return
        }
        if (action !== picker.Action.PICKED) return
        const document = data[picker.Response.DOCUMENTS]?.[0]
        const id = document?.[picker.Document.ID]
        if (!id) {
          reject(new GoogleDriveError("Google Picker did not return a file."))
          return
        }
        resolve({
          id,
          name: document[picker.Document.NAME] ?? "Decision.xlsx",
        })
      })
      .build()
    pickerInstance.setVisible(true)
  })
}

async function driveApiError(response, fallbackMessage) {
  let message = fallbackMessage
  try {
    const body = await response.json()
    message = body?.error?.message || message
  } catch {
    // The fallback is clearer than a second parsing error.
  }
  return new GoogleDriveError(message, {
    code: "drive_api_error",
    status: response.status,
  })
}

export async function downloadGoogleDriveFile({
  accessToken,
  fileId,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!response.ok)
    throw await driveApiError(response, "Unable to download the Drive file.")
  return response.arrayBuffer()
}

export async function uploadGoogleDriveSpreadsheet({
  accessToken,
  fileId = null,
  filename,
  data,
  fetchImpl = fetch,
}) {
  const boundary = `factorie_${Math.random().toString(36).slice(2)}`
  const metadata = JSON.stringify({
    name: filename,
    mimeType: SPREADSHEET_MIME_TYPE,
  })
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${SPREADSHEET_MIME_TYPE}\r\n\r\n`,
    data,
    `\r\n--${boundary}--`,
  ])
  const filePath = fileId ? `/${encodeURIComponent(fileId)}` : ""
  const response = await fetchImpl(
    `https://www.googleapis.com/upload/drive/v3/files${filePath}?uploadType=multipart&fields=id,name`,
    {
      method: fileId ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )
  if (!response.ok)
    throw await driveApiError(response, "Unable to save the spreadsheet to Drive.")

  let result
  try {
    result = await response.json()
  } catch {
    throw new GoogleDriveError("Google Drive returned an invalid upload response.")
  }
  if (!result?.id)
    throw new GoogleDriveError("Google Drive did not return the saved file ID.")
  return result
}

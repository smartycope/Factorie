import { assert, expect, test } from "vitest"

import {
  SPREADSHEET_MIME_TYPE,
  authorizeGoogleDrive,
  downloadGoogleDriveFile,
  isGoogleDriveConfigured,
  pickGoogleDriveSpreadsheet,
  uploadGoogleDriveSpreadsheet,
} from "../src/utils/googleDrive.js"

const config = {
  clientId: "client-id",
  apiKey: "api-key",
  appId: "app-id",
}

test("Google Drive configuration requires all public identifiers", () => {
  assert.equal(isGoogleDriveConfigured(config), true)
  assert.equal(isGoogleDriveConfigured({ ...config, apiKey: "" }), false)
})

test("authorization requests short-lived tokens without persisting them", async () => {
  const originalWindow = globalThis.window
  const requests = []
  const client = {
    callback: null,
    error_callback: null,
    requestAccessToken(options) {
      requests.push(options)
      this.callback({ access_token: `token-${requests.length}` })
    },
  }
  globalThis.window = {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(options) {
            assert.equal(options.client_id, config.clientId)
            assert.equal(options.scope, "https://www.googleapis.com/auth/drive.file")
            return client
          },
        },
      },
    },
  }

  try {
    assert.equal(await authorizeGoogleDrive(config), "token-1")
    assert.equal(await authorizeGoogleDrive(config), "token-2")
    assert.deepEqual(requests, [{ prompt: "consent" }, { prompt: "" }])
  } finally {
    globalThis.window = originalWindow
  }
})

test("authorization turns popup closure into a Drive error", async () => {
  const originalWindow = globalThis.window
  const alternateConfig = { ...config, clientId: "cancel-client" }
  const client = {
    callback: null,
    error_callback: null,
    requestAccessToken() {
      this.error_callback({ type: "popup_closed" })
    },
  }
  globalThis.window = {
    google: {
      accounts: {
        oauth2: { initTokenClient: () => client },
      },
    },
  }

  try {
    await expect(authorizeGoogleDrive(alternateConfig)).rejects.toMatchObject({
      name: "GoogleDriveError",
      code: "popup_closed",
    })
  } finally {
    globalThis.window = originalWindow
  }
})

test("Picker selects exactly one xlsx file", async () => {
  const originalWindow = globalThis.window
  let configuredMimeType
  class DocsView {
    setIncludeFolders() { return this }
    setSelectFolderEnabled() { return this }
    setMimeTypes(value) {
      configuredMimeType = value
      return this
    }
    setMode(value) {
      assert.equal(value, "list")
      return this
    }
  }
  class PickerBuilder {
    setAppId(value) { assert.equal(value, config.appId); return this }
    setOAuthToken(value) { assert.equal(value, "access-token"); return this }
    setDeveloperKey(value) { assert.equal(value, config.apiKey); return this }
    addView() { return this }
    setCallback(callback) { this.callback = callback; return this }
    build() {
      return {
        setVisible: () => this.callback({
          action: "picked",
          documents: [{ id: "file-id", name: "Decision.xlsx" }],
        }),
      }
    }
  }
  globalThis.window = {
    gapi: { load: () => {} },
    google: {
      picker: {
        DocsView,
        PickerBuilder,
        ViewId: { DOCS: "docs" },
        Response: { ACTION: "action", DOCUMENTS: "documents" },
        Document: { ID: "id", NAME: "name" },
        Action: { PICKED: "picked", CANCEL: "cancel", ERROR: "error" },
        DocsViewMode: { LIST: "list" },
      },
    },
  }

  try {
    assert.deepEqual(
      await pickGoogleDriveSpreadsheet("access-token", config),
      { id: "file-id", name: "Decision.xlsx" },
    )
    assert.equal(configuredMimeType, SPREADSHEET_MIME_TYPE)
  } finally {
    globalThis.window = originalWindow
  }
})

test("Picker errors close the dialog, log details, and reject", async () => {
  const originalWindow = globalThis.window
  const originalConsoleError = console.error
  const loggedErrors = []
  let visible = true

  class DocsView {
    setIncludeFolders() { return this }
    setSelectFolderEnabled() { return this }
    setMimeTypes() { return this }
    setMode() { return this }
  }
  class PickerBuilder {
    setAppId() { return this }
    setOAuthToken() { return this }
    setDeveloperKey() { return this }
    addView() { return this }
    setCallback(callback) { this.callback = callback; return this }
    build() {
      return {
        setVisible: (nextVisible) => {
          visible = nextVisible
          if (nextVisible)
            queueMicrotask(() => this.callback({
              action: "error",
              error: "selection_failed",
            }))
        },
      }
    }
  }
  globalThis.window = {
    gapi: { load: () => {} },
    google: {
      picker: {
        DocsView,
        PickerBuilder,
        ViewId: { DOCS: "docs" },
        Response: { ACTION: "action", DOCUMENTS: "docs" },
        Document: { ID: "id", NAME: "name" },
        Action: { PICKED: "picked", CANCEL: "cancel", ERROR: "error" },
        DocsViewMode: { LIST: "list" },
      },
    },
  }
  console.error = (...args) => loggedErrors.push(args)

  try {
    await expect(
      pickGoogleDriveSpreadsheet("access-token", config),
    ).rejects.toMatchObject({
      name: "GoogleDriveError",
      code: "picker_error",
    })
    assert.equal(visible, false)
    assert.equal(loggedErrors.length, 1)
    assert.equal(loggedErrors[0][0], "Google Picker reported an error")
    assert.deepEqual(loggedErrors[0][1], {
      action: "error",
      error: "selection_failed",
    })
  } finally {
    console.error = originalConsoleError
    globalThis.window = originalWindow
  }
})

test("downloads a Drive file as an ArrayBuffer", async () => {
  const expected = new Uint8Array([1, 2, 3]).buffer
  const fetchImpl = async (url, options) => {
    assert.equal(
      url,
      "https://www.googleapis.com/drive/v3/files/file-id?alt=media",
    )
    assert.equal(options.headers.Authorization, "Bearer access-token")
    return new Response(expected)
  }

  const actual = await downloadGoogleDriveFile({
    accessToken: "access-token",
    fileId: "file-id",
    fetchImpl,
  })
  assert.deepEqual(new Uint8Array(actual), new Uint8Array(expected))
})

test("creates and updates Drive spreadsheets with multipart uploads", async () => {
  const requests = []
  const fetchImpl = async (url, options) => {
    requests.push({ url, options })
    return Response.json({ id: requests.length === 1 ? "new-id" : "file-id" })
  }
  const args = {
    accessToken: "access-token",
    filename: "My Decision.xlsx",
    data: new TextEncoder().encode("workbook bytes"),
    fetchImpl,
  }

  assert.equal((await uploadGoogleDriveSpreadsheet(args)).id, "new-id")
  assert.equal(
    (await uploadGoogleDriveSpreadsheet({ ...args, fileId: "file-id" })).id,
    "file-id",
  )
  assert.equal(requests[0].options.method, "POST")
  assert.equal(requests[1].options.method, "PATCH")
  assert.match(requests[0].url, /files\?uploadType=multipart/)
  assert.match(requests[1].url, /files\/file-id\?uploadType=multipart/)
  assert.equal(requests[0].options.headers.Authorization, "Bearer access-token")
  assert.match(
    requests[0].options.headers["Content-Type"],
    /^multipart\/related; boundary=factorie_/,
  )
  const body = await requests[0].options.body.text()
  assert.match(body, /My Decision\.xlsx/)
  assert.match(body, /workbook bytes/)
})

test("Drive API failures retain their HTTP status without exposing tokens", async () => {
  const fetchImpl = async () =>
    Response.json(
      { error: { message: "File not found" } },
      { status: 404 },
    )

  await expect(
    downloadGoogleDriveFile({
      accessToken: "secret-token",
      fileId: "missing",
      fetchImpl,
    }),
  ).rejects.toMatchObject({
    name: "GoogleDriveError",
    status: 404,
    message: "File not found",
  })
})

test("malformed upload responses are rejected", async () => {
  await expect(
    uploadGoogleDriveSpreadsheet({
      accessToken: "token",
      filename: "Decision.xlsx",
      data: new Uint8Array(),
      fetchImpl: async () => new Response("not-json"),
    }),
  ).rejects.toThrow(/invalid upload response/)
})

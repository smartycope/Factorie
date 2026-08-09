import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

import GoogleDriveSpreadsheetPicker from
  "../src/components/GoogleDriveSpreadsheetPicker.jsx"
import { SPREADSHEET_MIME_TYPE } from "../src/utils/googleDrive.js"

vi.mock("@googleworkspace/drive-picker-react", () => ({
  DrivePicker: ({ children, onPicked, onCanceled, ...props }) => (
    <drive-picker {...props}>
      <button
        type="button"
        onClick={() =>
          onPicked({
            detail: {
              docs: [{ id: "file-id", name: "Decision.xlsx" }],
            },
          })
        }
      >
        Pick test file
      </button>
      <button type="button" onClick={() => onCanceled({ detail: {} })}>
        Cancel test picker
      </button>
      {children}
    </drive-picker>
  ),
  DrivePickerDocsView: (props) => <drive-picker-docs-view {...props} />,
}))

const config = {
  clientId: "client-id",
  apiKey: "api-key",
  appId: "app-id",
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test("configures the React Drive Picker for one xlsx in list mode", () => {
  render(
    <GoogleDriveSpreadsheetPicker
      accessToken="access-token"
      config={config}
      onPicked={() => {}}
      onCanceled={() => {}}
      onError={() => {}}
    />,
  )

  const picker = document.querySelector("drive-picker")
  const view = document.querySelector("drive-picker-docs-view")
  expect(picker.getAttribute("app-id")).toBe(config.appId)
  expect(picker.getAttribute("client-id")).toBe(config.clientId)
  expect(picker.getAttribute("developer-key")).toBe(config.apiKey)
  expect(picker.getAttribute("oauth-token")).toBe("access-token")
  expect(picker.getAttribute("max-items")).toBe("1")
  expect(view.getAttribute("view-id")).toBe("DOCS")
  expect(view.getAttribute("mime-types")).toBe(SPREADSHEET_MIME_TYPE)
  expect(view.getAttribute("include-folders")).toBe("false")
  expect(view.getAttribute("select-folder-enabled")).toBe("false")
  expect(view.getAttribute("mode")).toBe("LIST")
})

test("passes picked files and cancellations to the caller", () => {
  const onPicked = vi.fn()
  const onCanceled = vi.fn()
  render(
    <GoogleDriveSpreadsheetPicker
      accessToken="access-token"
      config={config}
      onPicked={onPicked}
      onCanceled={onCanceled}
      onError={() => {}}
    />,
  )

  fireEvent.click(screen.getByRole("button", { name: "Pick test file" }))
  expect(onPicked).toHaveBeenCalledWith({
    id: "file-id",
    name: "Decision.xlsx",
  })

  fireEvent.click(screen.getByRole("button", { name: "Cancel test picker" }))
  expect(onCanceled).toHaveBeenCalledOnce()
})

test("logs and forwards native Picker errors", () => {
  const onError = vi.fn()
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
  render(
    <GoogleDriveSpreadsheetPicker
      accessToken="access-token"
      config={config}
      onPicked={() => {}}
      onCanceled={() => {}}
      onError={onError}
    />,
  )
  const detail = { action: "error", message: "selection failed" }

  document.querySelector("drive-picker").dispatchEvent(
    new CustomEvent("picker-error", { detail }),
  )

  expect(consoleError).toHaveBeenCalledWith(
    "Google Drive Picker reported an error",
    detail,
  )
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "GoogleDriveError",
      code: "picker_error",
    }),
  )
})

import React from "react"
import {
  DrivePicker,
  DrivePickerDocsView,
} from "@googleworkspace/drive-picker-react"

import {
  GoogleDriveError,
  SPREADSHEET_MIME_TYPE,
} from "../utils/googleDrive"

export default function GoogleDriveSpreadsheetPicker({
  accessToken,
  config,
  onPicked,
  onCanceled,
  onError,
}) {
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    const pickerElement = containerRef.current?.querySelector("drive-picker")
    if (!pickerElement) return

    const handlePickerError = (event) => {
      console.error("Google Drive Picker reported an error", event.detail)
      onError(
        new GoogleDriveError("Google Drive Picker encountered an error.", {
          code: "picker_error",
        }),
      )
    }
    pickerElement.addEventListener("picker-error", handlePickerError)
    return () =>
      pickerElement.removeEventListener("picker-error", handlePickerError)
  }, [onError])

  function handlePicked(event) {
    const document = event.detail?.docs?.[0]
    if (!document?.id) {
      console.error(
        "Google Drive Picker did not return a selected file",
        event.detail,
      )
      onError(
        new GoogleDriveError(
          "Google Drive Picker did not return a selected file.",
          { code: "picker_missing_file" },
        ),
      )
      return
    }
    onPicked({
      id: document.id,
      name: document.name ?? "Decision.xlsx",
    })
  }

  function handleOauthError(event) {
    console.error("Google Drive Picker OAuth failed", event.detail)
    onError(
      new GoogleDriveError("Google Drive Picker authorization failed.", {
        code: "picker_oauth_error",
      }),
    )
  }

  return (
    <span ref={containerRef}>
      <DrivePicker
        app-id={config.appId}
        client-id={config.clientId}
        developer-key={config.apiKey}
        oauth-token={accessToken}
        origin={window.location.origin}
        max-items={1}
        onPicked={handlePicked}
        onCanceled={onCanceled}
        onOauthError={handleOauthError}
      >
        <DrivePickerDocsView
          view-id="DOCS"
          mime-types={SPREADSHEET_MIME_TYPE}
          include-folders="false"
          select-folder-enabled="false"
          mode="LIST"
        />
      </DrivePicker>
    </span>
  )
}

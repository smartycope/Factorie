import XLSX from "xlsx-js-style"
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate"
import Decision from "../models/Decision"

const factorPackModules = import.meta.glob("../factor-packs/*.json", {
  eager: true,
  import: "default",
})

const factorPacks = Object.values(factorPackModules)

function cellValue(sheet, address) {
  return sheet[address]?.v
}

function cellText(sheet, address) {
  const value = cellValue(sheet, address)
  return value == null ? "" : String(value).trim()
}

function spreadsheetError(message) {
  throw new Error(message)
}

function getFactorPack(name) {
  return factorPacks.find((pack) => pack.name === name)
}

function describeAvailableFactorPacks() {
  return factorPacks.map((pack) => `"${pack.name}"`).join(", ")
}

function parseFactorPackNames(sheet) {
  const rawNames = cellText(sheet, "B2")
  if (!rawNames) return []

  const names = rawNames.split(",").map((name) => name.trim())
  const blankIndex = names.findIndex((name) => !name)
  if (blankIndex !== -1)
    spreadsheetError(
      `Could not parse factor packs in B2: entry ${blankIndex + 1} is empty.`,
    )

  const duplicate = names.find((name, index) => names.indexOf(name) !== index)
  if (duplicate)
    spreadsheetError(`Could not parse factor packs in B2: "${duplicate}" is listed more than once.`)

  const unknown = names.find((name) => !getFactorPack(name))
  if (unknown)
    spreadsheetError(
      `Could not parse factor packs in B2: "${unknown}" is not a valid factor pack. Available factor packs are: ${describeAvailableFactorPacks()}.`,
    )

  return names
}

function parseFactorNames(sheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1")
  const factorNames = []
  let foundBlank = false

  for (let row = 5; row <= range.e.r; row += 1) {
    const address = XLSX.utils.encode_cell({ r: row, c: 0 })
    const name = cellText(sheet, address)
    if (!name) {
      foundBlank = true
      continue
    }
    if (foundBlank)
      spreadsheetError(
        `Could not parse factors: ${address} has a factor name after an empty factor row. Factor names must be contiguous from A6.`,
      )
    if (factorNames.includes(name))
      spreadsheetError(`Could not parse factors: "${name}" is listed more than once in column A.`)
    factorNames.push(name)
  }

  if (factorNames.length === 0)
    spreadsheetError("Could not parse factors: A6 must contain at least one factor name.")

  return factorNames
}

function parseOptionNames(sheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1")
  const optionNames = []
  let foundBlank = false

  for (let column = 1; column <= range.e.c; column += 1) {
    const address = XLSX.utils.encode_cell({ r: 4, c: column })
    const name = cellText(sheet, address)
    if (!name) {
      foundBlank = true
      continue
    }
    if (foundBlank)
      spreadsheetError(
        `Could not parse options: ${address} has an option name after an empty option header. Option names must be contiguous from B5.`,
      )
    if (optionNames.includes(name))
      spreadsheetError(`Could not parse options: "${name}" is listed more than once in row 5.`)
    optionNames.push(name)
  }

  if (optionNames.length === 0)
    spreadsheetError("Could not parse options: B5 must contain at least one option name.")

  return optionNames
}

function parseNumber(sheet, address, label, optional = false) {
  const value = cellValue(sheet, address)
  if (value == null || (typeof value === "string" && !value.trim())) {
    if (optional) return null
    spreadsheetError(`Could not parse ${label}: ${address} must contain a number.`)
  }

  const number = typeof value === "number" ? value : Number(String(value).trim())
  if (!Number.isFinite(number))
    spreadsheetError(`Could not parse ${label}: ${address} must contain a finite number.`)
  return number
}

function parseOptimal(sheet, address, label) {
  const value = cellValue(sheet, address)
  const text = String(value ?? "").trim().toLowerCase()
  if (text === "min" || text === "-infinity") return -Infinity
  if (text === "max" || text === "infinity" || text === "+infinity")
    return Infinity
  return parseNumber(sheet, address, label, true)
}

function serializeOptimal(optimal) {
  if (optimal === -Infinity) return "Min"
  if (optimal === Infinity) return "Max"
  return optimal ?? ""
}

function serializeAnswer(answer) {
  if (!answer.isAnswered()) return ""
  const [min, max, tentative] = answer.serialize()
  const value = answer.isRanged() ? `${min} - ${max}` : String(min)
  return value + (tentative ? "?" : "")
}

function spreadsheetColor(color) {
  return color ? `FF${color.slice(1)}` : null
}

function cellFill(color) {
  return {
    patternType: "solid",
    fgColor: { rgb: spreadsheetColor(color) },
  }
}

function freezeWorksheetPanes(workbookData) {
  const files = unzipSync(new Uint8Array(workbookData))
  const paneConfigs = [
    {
      name: "Decision",
      path: "xl/worksheets/sheet1.xml",
      xSplit: 1,
      ySplit: 5,
      topLeftCell: "B6",
    },
    {
      name: "Factors",
      path: "xl/worksheets/sheet2.xml",
      xSplit: 1,
      ySplit: 1,
      topLeftCell: "B2",
    },
    {
      name: "Options",
      path: "xl/worksheets/sheet3.xml",
      xSplit: 1,
      ySplit: 1,
      topLeftCell: "B2",
    },
  ]

  for (const { name, path, xSplit, ySplit, topLeftCell } of paneConfigs) {
    const worksheetXml = strFromU8(files[path])
    const frozenSheetView =
      '<sheetView workbookViewId="0">' +
      `<pane xSplit="${xSplit}" ySplit="${ySplit}" topLeftCell="${topLeftCell}" activePane="bottomRight" state="frozen"/>` +
      '<selection pane="topRight" activeCell="B1" sqref="B1"/>' +
      `<selection pane="bottomLeft" activeCell="A${ySplit + 1}" sqref="A${ySplit + 1}"/>` +
      `<selection pane="bottomRight" activeCell="${topLeftCell}" sqref="${topLeftCell}"/>` +
      "</sheetView>"
    const frozenWorksheetXml = worksheetXml.replace(
      '<sheetView workbookViewId="0"/>',
      frozenSheetView,
    )
    if (frozenWorksheetXml === worksheetXml)
      throw new Error(`Could not freeze the ${name} worksheet pane.`)
    files[path] = strToU8(frozenWorksheetXml)
  }

  return zipSync(files, { level: 6 }).buffer
}

function cellBackgroundColor(sheet, address) {
  const style = sheet[address]?.s
  const fill = style?.fill ?? style
  const rgb = fill?.fgColor?.rgb ?? fill?.bgColor?.rgb
  return typeof rgb === "string" && /^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(rgb) ?
      `#${rgb.slice(-6)}`
    : null
}

function parseFactorSpecifications(sheet, decisionFactorNames) {
  if (!sheet)
    spreadsheetError('Could not parse factors: the workbook must contain a sheet named "Factors".')

  const expectedHeaders = ["Factor", "Unit", "Optimal", "Weight", "Min", "Max"]
  expectedHeaders.forEach((header, column) => {
    const address = XLSX.utils.encode_cell({ r: 0, c: column })
    if (cellText(sheet, address) !== header)
      spreadsheetError(`Could not parse factors: ${address} must say "${header}".`)
  })

  const specifications = new Map()
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1")
  let encounteredBlankRow = false

  for (let row = 1; row <= range.e.r; row += 1) {
    const factorAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
    const name = cellText(sheet, factorAddress)
    const rowHasValues = expectedHeaders.some(
      (_, column) =>
        cellValue(sheet, XLSX.utils.encode_cell({ r: row, c: column })) != null,
    )

    if (!name) {
      if (rowHasValues)
        spreadsheetError(
          `Could not parse factor row ${row + 1}: ${factorAddress} must contain a factor name.`,
        )
      encounteredBlankRow = true
      continue
    }

    if (encounteredBlankRow)
      spreadsheetError(
        `Could not parse factors: ${factorAddress} contains "${name}" after an empty factor row. Factors must be contiguous from A2.`,
      )
    if (specifications.has(name))
      spreadsheetError(`Could not parse factors: "${name}" is listed more than once.`)

    const specification = {
      name,
      unit: cellText(sheet, XLSX.utils.encode_cell({ r: row, c: 1 })) || null,
      optimal: parseOptimal(sheet, XLSX.utils.encode_cell({ r: row, c: 2 }), `optimal for "${name}"`),
      weight: parseNumber(sheet, XLSX.utils.encode_cell({ r: row, c: 3 }), `weight for "${name}"`, true),
      min: parseNumber(sheet, XLSX.utils.encode_cell({ r: row, c: 4 }), `minimum for "${name}"`, true),
      max: parseNumber(sheet, XLSX.utils.encode_cell({ r: row, c: 5 }), `maximum for "${name}"`, true),
      color: cellBackgroundColor(sheet, factorAddress),
    }

    if (
      specification.weight != null &&
      (specification.weight < 0 || specification.weight > 1)
    )
      spreadsheetError(
        `Could not parse weight for "${name}": ${XLSX.utils.encode_cell({ r: row, c: 3 })} must be between 0 and 1.`,
      )
    if (
      specification.min != null &&
      specification.max != null &&
      specification.min >= specification.max
    )
      spreadsheetError(
        `Could not parse bounds for "${name}": the minimum must be less than the maximum.`,
      )

    specifications.set(name, specification)
  }

  if (specifications.size === 0)
    spreadsheetError("Could not parse factors: the Factors sheet must list at least one factor from A2.")

  const factorNames = [...specifications.keys()]
  const sheetsHaveDifferentFactors =
    factorNames.length !== decisionFactorNames.length ||
    factorNames.some((name) => !decisionFactorNames.includes(name))
  if (sheetsHaveDifferentFactors){
		let msg = "Could not parse factors: the factors in the Factors sheet must match the factors in the Decision sheet."
		const factorsInDecisionButNotInFactors = decisionFactorNames.filter((name) => !factorNames.includes(name))
		const factorsInFactorsButNotInDecision = factorNames.filter((name) => !decisionFactorNames.includes(name))
		if (factorsInDecisionButNotInFactors.length){
			msg += "\n\nFactors in the Decision sheet but not in the Factors sheet:"
			factorsInDecisionButNotInFactors.forEach((factor) => msg += `\n- ${factor}`)
		}
		if (factorsInFactorsButNotInDecision.length){
			msg += "\n\nFactors in the Factors sheet but not in the Decision sheet:"
			factorsInFactorsButNotInDecision.forEach((factor) => msg += `\n- ${factor}`)
		}
    spreadsheetError(msg)
	}

  return decisionFactorNames.map((name) => specifications.get(name))
}

function parseOptionNotes(sheet, decision, onWarning) {
  if (!sheet) return

  const expectedHeaders = ["Option", "Notes"]
  expectedHeaders.forEach((header, column) => {
    const address = XLSX.utils.encode_cell({ r: 0, c: column })
    if (cellText(sheet, address) !== header)
      spreadsheetError(`Could not parse option notes: ${address} must say "${header}".`)
  })
  const hiddenHeader = cellText(sheet, "C1")
  if (hiddenHeader && hiddenHeader !== "Hidden")
    spreadsheetError('Could not parse options: C1 must say "Hidden".')

  function parseHidden(value, address) {
    if (value == null || value === "") return false
    if (typeof value === "boolean") return value
    const normalized = String(value).trim().toLowerCase()
    if (["true", "yes", "1"].includes(normalized)) return true
    if (["false", "no", "0"].includes(normalized)) return false
    spreadsheetError(
      `Could not parse options: ${address} must be TRUE or FALSE.`,
    )
  }

  const notes = new Map()
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1")
  let encounteredBlankRow = false

  for (let row = 1; row <= range.e.r; row += 1) {
    const optionAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
    const notesAddress = XLSX.utils.encode_cell({ r: row, c: 1 })
    const hiddenAddress = XLSX.utils.encode_cell({ r: row, c: 2 })
    const option = cellText(sheet, optionAddress)
    const noteValue = cellValue(sheet, notesAddress)
    const hiddenValue = cellValue(sheet, hiddenAddress)
    const rowHasValues =
      cellValue(sheet, optionAddress) != null ||
      noteValue != null ||
      hiddenValue != null

    if (!option) {
      if (rowHasValues)
        spreadsheetError(
          `Could not parse option notes row ${row + 1}: ${optionAddress} must contain an option name.`,
        )
      encounteredBlankRow = true
      continue
    }

    if (encounteredBlankRow)
      spreadsheetError(
        `Could not parse option notes: ${optionAddress} contains "${option}" after an empty option row. Options must be contiguous from A2.`,
      )
    if (notes.has(option))
      spreadsheetError(`Could not parse option notes: "${option}" is listed more than once.`)

    notes.set(option, {
      notes: noteValue == null ? "" : String(noteValue),
      hidden: parseHidden(hiddenValue, hiddenAddress),
      color: cellBackgroundColor(sheet, optionAddress),
    })
  }

  const extraOptions = [...notes.keys()].filter(
    (optionName) =>
      !decision.options.some((option) => option.name === optionName),
  )
  if (extraOptions.length) {
    onWarning(
      "The Options sheet contains options that are not in the Decision sheet. " +
        "Their metadata was ignored:\n" +
        extraOptions.map((option) => `- ${option}`).join("\n"),
    )
  }

  decision.options.forEach((option, index) => {
    const metadata = notes.get(option.name)
    if (!metadata) return
    decision.setOptionNote(index, metadata.notes)
    decision.setOptionHidden(index, metadata.hidden)
    decision.setOptionColor(index, metadata.color)
  })
}

function parseAnswers(sheet, decision, factorNames, optionNames) {
  optionNames.forEach((optionName) => decision.addOption(optionName))
  const errors = []

  function validAnswerDescription(factor) {
    const discreteValues = factor.discreteValues()
    if (discreteValues.length)
      return `Valid options: ${discreteValues
        .map(({ name }) => `"${name}"`)
        .join(", ")}.`

    if (factor.min == null && factor.max == null)
      return "Valid range: any finite number."
    return `Valid range: ${factor.min ?? "−∞"} to ${factor.max ?? "∞"}.`
  }

  factorNames.forEach((factorName, factorIndex) => {
    optionNames.forEach((optionName, optionIndex) => {
      const address = XLSX.utils.encode_cell({ r: factorIndex + 5, c: optionIndex + 1 })
      const value = cellValue(sheet, address)
      try {
        decision.setAnswer(optionIndex, factorIndex, value == null ? "" : value)
      } catch (error) {
        errors.push(
          `${address} for "${optionName}" / "${factorName}": ${error.message}. ${validAnswerDescription(decision.factors[factorIndex])}`,
        )
      }
    })
  })

  if (errors.length)
    spreadsheetError(
      "Could not parse answers:\n" +
        errors.map((error) => `- ${error}`).join("\n"),
    )
}

export function parseDecisionSpreadsheet(
  arrayBuffer,
  { onWarning = (message) => console.warn(message) } = {},
) {
  let workbook
  try {
    workbook = XLSX.read(arrayBuffer, { type: "array", cellStyles: true })
  } catch (error) {
    spreadsheetError(`Could not read this .xlsx file: ${error.message}`)
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = sheetName ? workbook.Sheets[sheetName] : null
  if (!sheet) spreadsheetError("Could not read this .xlsx file: it does not contain a worksheet.")

  const name = cellText(sheet, "B1")
  if (!name) spreadsheetError("Could not parse decision name: B1 must contain a non-empty name.")
	// We don't need to be this pedantic
  // if (cellText(sheet, "B4").toLowerCase() !== "options")
  //   spreadsheetError('Could not parse spreadsheet: B4 must say "Options".')
  // if (cellText(sheet, "A5").toLowerCase() !== "factors")
  //   spreadsheetError('Could not parse spreadsheet: A5 must say "Factors".')

  const factorPackNames = parseFactorPackNames(sheet)
  const factorNames = parseFactorNames(sheet)
  const optionNames = parseOptionNames(sheet)
  const factorSpecifications = parseFactorSpecifications(
    workbook.Sheets.Factors,
    factorNames,
  )
  const decision = new Decision(name)
  decision.factorPacks = new Set(factorPackNames)
  factorSpecifications.forEach((factor) => decision.addFactor(factor))
  parseAnswers(sheet, decision, factorNames, optionNames)
  parseOptionNotes(workbook.Sheets.Options, decision, onWarning)

  return decision
}

export function createDecisionSpreadsheet(decision) {
  const rows = [
    ["Decision:", decision.name],
    ["Factor Packs:", Array.from(decision.factorPacks ?? []).join(", ")],
    [],
    [undefined, "Options"],
    ["Factors", ...decision.options.map((option) => option.name)],
    ...decision.factors.map((factor, factorIndex) => [
      factor.name,
      ...decision.options.map((_, optionIndex) =>
        serializeAnswer(decision.answers[optionIndex][factorIndex]),
      ),
    ]),
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet["!cols"] = [
    { wch: Math.max(12, ...decision.factors.map(({ name }) => name.length + 2)) },
    ...decision.options.map((option) => ({
      wch: Math.max(12, option.name.length + 2),
    })),
  ]

  const headerCells = [
    "A1",
    "A2",
    "B4",
    "A5",
    ...decision.options.map((_, index) =>
      XLSX.utils.encode_cell({ r: 4, c: index + 1 }),
    ),
  ]
  headerCells.forEach((address) => {
    if (sheet[address]) sheet[address].s = { font: { bold: true } }
  })
  decision.options.forEach((option, index) => {
    if (!option.color) return
    const address = XLSX.utils.encode_cell({ r: 4, c: index + 1 })
    sheet[address].s = { ...sheet[address].s, fill: cellFill(option.color) }
  })
  decision.factors.forEach((factor, index) => {
    if (!factor.color) return
    const address = XLSX.utils.encode_cell({ r: index + 5, c: 0 })
    sheet[address].s = { ...sheet[address].s, fill: cellFill(factor.color) }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "Decision")
  const factorSheet = XLSX.utils.aoa_to_sheet([
    ["Factor", "Unit", "Optimal", "Weight", "Min", "Max"],
    ...decision.factors.map((factor) => [
      factor.name,
      factor.unit ?? "",
      serializeOptimal(factor.optimal),
      factor.weight ?? "",
      factor.min ?? "",
      factor.max ?? "",
    ]),
  ])
  factorSheet["!cols"] = [
    { wch: Math.max(12, ...decision.factors.map(({ name }) => name.length + 2)) },
    { wch: Math.max(12, ...decision.factors.map(({ unit }) => String(unit ?? "").length + 2)) },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ]
  const factorSheetHeaderCells = ["A1", "B1", "C1", "D1", "E1", "F1"]
  factorSheetHeaderCells.forEach((address) => {
    if (factorSheet[address]) factorSheet[address].s = { font: { bold: true } }
  })
  decision.factors.forEach((factor, index) => {
    if (factor.color)
      factorSheet[XLSX.utils.encode_cell({ r: index + 1, c: 0 })].s = {
        fill: cellFill(factor.color),
      }
    const weightCell = factorSheet[
      XLSX.utils.encode_cell({ r: index + 1, c: 3 })
    ]
    if (weightCell) {
      weightCell.z = "0.0%"
      weightCell.s = { ...weightCell.s, numFmt: "0.0%" }
    }
  })
  XLSX.utils.book_append_sheet(workbook, factorSheet, "Factors")
  const optionSheet = XLSX.utils.aoa_to_sheet([
    ["Option", "Notes", "Hidden"],
    ...decision.options.map((option) => [
      option.name,
      option.notes,
      option.hidden,
    ]),
  ])
  optionSheet["!cols"] = [
    {
      wch: Math.max(
        12,
        ...decision.options.map((option) => option.name.length + 2),
      ),
    },
    {
      wch: Math.min(
        80,
        Math.max(
          24,
          ...decision.options.map(
            (option) => String(option.notes).length + 2,
          ),
        ),
      ),
    },
    { wch: 12 },
  ]
  const optionSheetHeaderCells = ["A1", "B1", "C1"]
  optionSheetHeaderCells.forEach((address) => {
    if (optionSheet[address])
      optionSheet[address].s = { font: { bold: true } }
  })
  decision.options.forEach((option, index) => {
    if (option.color)
      optionSheet[XLSX.utils.encode_cell({ r: index + 1, c: 0 })].s = {
        fill: cellFill(option.color),
      }
  })
  XLSX.utils.book_append_sheet(workbook, optionSheet, "Options")
  return freezeWorksheetPanes(
    XLSX.write(workbook, { bookType: "xlsx", type: "array" }),
  )
}

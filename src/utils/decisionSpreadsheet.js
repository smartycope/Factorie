import * as XLSX from "xlsx"
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
      optimal: parseNumber(sheet, XLSX.utils.encode_cell({ r: row, c: 2 }), `optimal for "${name}"`, true),
      weight: parseNumber(sheet, XLSX.utils.encode_cell({ r: row, c: 3 }), `weight for "${name}"`, true),
      min: parseNumber(sheet, XLSX.utils.encode_cell({ r: row, c: 4 }), `minimum for "${name}"`, true),
      max: parseNumber(sheet, XLSX.utils.encode_cell({ r: row, c: 5 }), `maximum for "${name}"`, true),
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
		console.log({factorNames, decisionFactorNames})
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

function parseAnswers(sheet, decision, factorNames, optionNames) {
  optionNames.forEach((optionName) => decision.addOption(optionName))

  factorNames.forEach((factorName, factorIndex) => {
    optionNames.forEach((optionName, optionIndex) => {
      const address = XLSX.utils.encode_cell({ r: factorIndex + 5, c: optionIndex + 1 })
      const value = cellValue(sheet, address)
      try {
        decision.setAnswer(optionIndex, factorIndex, value == null ? "" : value)
      } catch (error) {
        spreadsheetError(
          `Could not parse answer at ${address} for "${optionName}" / "${factorName}": ${error.message}.`,
        )
      }
    })
  })
}

export function parseDecisionSpreadsheet(arrayBuffer) {
  let workbook
  try {
    workbook = XLSX.read(arrayBuffer, { type: "array" })
  } catch (error) {
    spreadsheetError(`Could not read this .xlsx file: ${error.message}`)
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = sheetName ? workbook.Sheets[sheetName] : null
  if (!sheet) spreadsheetError("Could not read this .xlsx file: it does not contain a worksheet.")

  const name = cellText(sheet, "B1")
  if (!name) spreadsheetError("Could not parse decision name: B1 must contain a non-empty name.")
  if (cellText(sheet, "B4").toLowerCase() !== "options")
    spreadsheetError('Could not parse spreadsheet: B4 must say "Options".')
  if (cellText(sheet, "A5").toLowerCase() !== "factors")
    spreadsheetError('Could not parse spreadsheet: A5 must say "Factors".')

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

  return decision
}

export function createDecisionSpreadsheet(decision) {
  const rows = [
    ["Decision:", decision.name],
    ["Factor Packs:", Array.from(decision.factorPacks ?? []).join(", ")],
    [],
    [undefined, "Options"],
    ["Factors", ...decision.options],
    ...decision.factors.names.map((factor, factorIndex) => [
      factor,
      ...decision.options.map((_, optionIndex) =>
        decision.answers[optionIndex][factorIndex].toString(),
      ),
    ]),
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet["!cols"] = [
    { wch: Math.max(12, ...decision.factors.names.map((name) => name.length + 2)) },
    ...decision.options.map((option) => ({ wch: Math.max(12, option.length + 2) })),
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

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "Decision")
  const factorSheet = XLSX.utils.aoa_to_sheet([
    ["Factor", "Unit", "Optimal", "Weight", "Min", "Max"],
    ...decision.factors.names.map((name, index) => [
      name,
      decision.factors.units[index] ?? "",
      decision.factors.optimals[index] ?? "",
      decision.factors.weights[index] ?? "",
      decision.factors.mins[index] ?? "",
      decision.factors.maxs[index] ?? "",
    ]),
  ])
  factorSheet["!cols"] = [
    { wch: Math.max(12, ...decision.factors.names.map((name) => name.length + 2)) },
    { wch: Math.max(12, ...decision.factors.units.map((unit) => String(unit ?? "").length + 2)) },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ]
  const factorSheetHeaderCells = ["A1", "B1", "C1", "D1", "E1", "F1"]
  factorSheetHeaderCells.forEach((address) => {
    if (factorSheet[address]) factorSheet[address].s = { font: { bold: true } }
  })
  XLSX.utils.book_append_sheet(workbook, factorSheet, "Factors")
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" })
}

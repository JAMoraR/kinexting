import { getCountries, getCountryCallingCode } from "libphonenumber-js/min"

export type CountryPhoneData = {
  iso: string
  code: string
  name: string
}

const countryNameFormatter = new Intl.DisplayNames(["es"], { type: "region" })

const normalizeText = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export const getCountryPhoneData = (): CountryPhoneData[] => {
  return getCountries()
    .map((iso) => {
      const dialingCode = getCountryCallingCode(iso)
      return {
        iso,
        code: `+${dialingCode}`,
        name: countryNameFormatter.of(iso) || iso,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
}

export const filterCountries = (query: string): CountryPhoneData[] => {
  if (!query.trim()) return getCountryPhoneData()

  const normalizedQuery = normalizeText(query)

  return getCountryPhoneData().filter((country) => {
    return (
      normalizeText(country.iso).includes(normalizedQuery) ||
      country.code.includes(normalizedQuery) ||
      normalizeText(country.name).includes(normalizedQuery)
    )
  })
}

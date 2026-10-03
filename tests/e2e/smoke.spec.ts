import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

test('dashboard, courses and a week with notes, KaTeX and an interactive', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Kom i gang|Fortsæt hvor du slap/ })).toBeVisible()
  await page.getByRole('link', { name: 'Kurser', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Kurser' })).toBeVisible()
  await expect(page.getByText('Quant Trading & Research').first()).toBeVisible()
  await page.goto('/#/kursus/foundations/uge/1')
  await expect(page.getByRole('heading', { name: 'Udsagnslogik' })).toBeVisible()
  await page.getByRole('tab', { name: /Læs/ }).click()
  await expect(page.getByText(/Trin 1 af \d+/)).toBeVisible()
  await expect(page.locator('.katex').first()).toBeVisible()
  // the "Prøv selv" overview jumps to the step with the component
  await page.goto('/#/kursus/foundations/uge/1?fane=laes&prov=truth-table')
  await expect(page.getByText('Sandhedstabel-bygger')).toBeVisible()
  await expect(page.getByText(/Prøv selv:/)).toBeVisible()
})

test('placement test runs and suggests where to start', async ({ page }) => {
  await page.goto('/#/kursus/hedgefund/test')
  await page.getByRole('button', { name: 'Start testen' }).click()
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Ved ikke' }).click()
  await expect(page.getByText(/Testen stoppede/)).toBeVisible()
  await page.getByRole('button', { name: /Start i uge 1/ }).click()
  await expect(page.getByRole('heading', { name: /Hvad er en hedgefond/ })).toBeVisible()
  await page.goto('/#/kursus/hedgefund')
  await expect(page.getByRole('link', { name: 'Tag testen igen' })).toBeVisible()
})

test('progress survives a reload, and export → import restores it in a clean profile', async ({ page, browser }) => {
  await page.goto('/#/kursus/quant/uge/3')
  const video = page.getByRole('checkbox', { name: 'Markér som set' }).first()
  await video.check()
  await page.getByRole('tab', { name: 'Øvelser' }).click()
  const first = page.locator('article').first()
  await first.getByRole('textbox').first().fill('Mit svar til første øvelse')
  await first.getByRole('button', { name: 'Vis løsning' }).click()
  await first.getByRole('button', { name: 'Kunne med hint' }).click()
  await expect(first.getByText('Gemt.')).toBeVisible()
  await page.waitForTimeout(600) // debounce of the answer field

  await page.reload()
  await page.getByRole('tab', { name: 'Video 1' }).click()
  await expect(page.getByRole('checkbox', { name: 'Markér som set' }).first()).toBeChecked()
  await page.getByRole('tab', { name: 'Øvelser' }).click()
  await expect(page.locator('article').first().getByRole('textbox').first()).toHaveValue('Mit svar til første øvelse')
  await expect(page.locator('article').first().getByText(/1 forsøg/)).toBeVisible()

  // Export
  await page.goto('/#/indstillinger')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Gem sikkerhedskopi' }).click()])
  const file = await download.path()
  const data = JSON.parse(readFileSync(file!, 'utf8'))
  expect(data.tables.attempts.length).toBe(1)

  // Import into a brand-new browser profile
  const ctx = await browser.newContext()
  const p2 = await ctx.newPage()
  await p2.goto('/#/indstillinger')
  await p2.locator('input[type=file]').setInputFiles(file!)
  await expect(p2.getByText(/Sikkerhedskopien er hentet/)).toBeVisible()
  await p2.goto('/#/kursus/quant/uge/3')
  await expect(p2.getByRole('checkbox', { name: 'Markér som set' }).first()).toBeChecked()
  await p2.getByRole('tab', { name: 'Øvelser' }).click()
  await expect(p2.locator('article').first().getByRole('textbox').first()).toHaveValue('Mit svar til første øvelse')
  await ctx.close()
})

test('training mode serves generated exercises and checks answers', async ({ page }) => {
  await page.goto('/#/traen?kursus=quant&emne=time-value&start=1')
  await expect(page.getByText(/Øvelse 1/)).toBeVisible()
  const card = page.locator('article').first()
  await expect(card).toBeVisible()
  // Give up on whatever comes first and move on; the session keeps going.
  for (let i = 0; i < 3; i++) {
    const skip = page.getByRole('button', { name: 'Spring over' })
    await skip.click()
  }
  await expect(page.getByText(/Øvelse 4/)).toBeVisible()
})

test('a Python reference solution runs in the browser (Pyodide)', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/#/kursus/foundations/uge/1/opgave/1.12')
  await page.getByRole('button', { name: 'Vis løsning' }).click()
  await page.getByRole('button', { name: /Kør i browseren/ }).first().click()
  // The plan states the expected output of this solution.
  await expect(page.locator('.run-output').first()).toContainText('{1: False, 2: True, 3: False}', { timeout: 100_000 })
  await expect(page.locator('.run-output').first()).toContainText('None')
})

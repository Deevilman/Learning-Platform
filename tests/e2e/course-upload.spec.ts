import { test, expect, type BrowserContext } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FIXTURE = join(import.meta.dirname, '../fixtures/testkursus.md')
const SUPABASE = 'https://dttnflehddxlmprrstbf.supabase.co'

/** A tiny stand-in for Supabase (auth session, records, courses table, storage), shared by two "devices". */
function fakeSupabase() {
  const rows = new Map<string, Record<string, unknown>>()
  const files = new Map<string, string>()
  const judged: Record<string, unknown>[] = []
  const user = { id: '00000000-0000-4000-8000-000000000001', email: 'elev@example.com', aud: 'authenticated', role: 'authenticated' }
  const session = { access_token: 'test-token', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600 * 24 * 365, expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365, user }
  async function attach(context: BrowserContext) {
    await context.addInitScript((s) => localStorage.setItem('lp-supabase-auth', JSON.stringify(s)), session)
    await context.route(`${SUPABASE}/**`, async (route) => {
      const req = route.request()
      const url = new URL(req.url())
      const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      if (url.pathname.startsWith('/auth/v1/user')) return json(user)
      if (url.pathname.startsWith('/auth/v1/token')) return json(session)
      if (url.pathname === '/rest/v1/records') return req.method() === 'GET' ? json([]) : json([], 201)
      if (url.pathname === '/rest/v1/courses') {
        if (req.method() === 'GET') return json([...rows.values()])
        const body = JSON.parse(req.postData() || '{}')
        for (const r of Array.isArray(body) ? body : [body]) rows.set(r.slug, { ...(rows.get(r.slug) || {}), ...r })
        return json([], 201)
      }
      const obj = /^\/storage\/v1\/object\/(?:authenticated\/)?courses\/(.+)$/.exec(url.pathname)
      if (obj && (req.method() === 'POST' || req.method() === 'PUT')) {
        let body = req.postDataBuffer()?.toString('utf8') || ''
        // supabase-js sends a Blob as multipart form data: keep only the file part
        const boundary = /boundary=(.+)$/.exec(req.headers()['content-type'] || '')?.[1]
        if (boundary) {
          const part = body.split(`--${boundary}`).find((p) => /filename=|name="file"|name=""/.test(p) && p.includes('---')) || ''
          body = part.slice(part.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '')
        }
        files.set(decodeURIComponent(obj[1]), body)
        return json({ Key: `courses/${obj[1]}` })
      }
      if (obj && req.method() === 'GET') {
        const f = files.get(decodeURIComponent(obj[1]))
        return f === undefined ? json({ error: 'not found' }, 404) : route.fulfill({ status: 200, contentType: 'text/markdown', body: f })
      }
      if (url.pathname === '/storage/v1/object/courses' && req.method() === 'DELETE') return json([])
      // the judge (Edge Function), answering like Judge0 would for a correct program
      if (url.pathname === '/functions/v1/judge') {
        const body = JSON.parse(req.postData() || '{}')
        judged.push(body)
        const pub = { verdict: 'AC', hidden: false, input: '3\nsand\nfalsk\nsand\n', expected: '2\n', got: '2\n', timeMs: 12 }
        const hid = { verdict: 'AC', hidden: true, timeMs: 10 }
        return json(body.mode === 'submit' ? { verdict: 'AC', tests: [pub, hid, hid], passed: 3, total: 3 } : { verdict: 'AC', tests: [pub], passed: 1, total: 1 })
      }
      return json({})
    })
  }
  return { attach, rows, files, judged }
}

test('a single course file added in a clean browser works fully', async ({ page }) => {
  await page.goto('/#/kurser')
  await page.getByRole('link', { name: '+ Tilføj kursus' }).click()
  await page.getByLabel('Kursusfil').setInputFiles(FIXTURE)
  const preview = page.getByLabel('Forhåndsvisning')
  await expect(preview.getByRole('heading', { name: 'Testkursus i logik' })).toBeVisible({ timeout: 30_000 })
  await expect(preview.getByText('uger')).toBeVisible()
  await expect(preview.locator('.stat', { hasText: 'øvelser' })).toContainText('4')
  await expect(preview.locator('.stat', { hasText: 'lektioner' })).toContainText('2')
  await preview.getByRole('button', { name: 'Tilføj' }).click()
  await expect(page.getByText('"Testkursus i logik" er tilføjet')).toBeVisible()
  await expect(page.getByText(/Log ind under Indstillinger/)).toBeVisible()

  // the course is on the course list and works like the site's own
  await page.getByRole('link', { name: 'Gå til kurset →' }).click()
  await expect(page.getByRole('heading', { name: 'Testkursus i logik' })).toBeVisible()
  await expect(page.getByText('Din vej gennem kurset')).toBeVisible()
  await page.getByRole('link', { name: /Start uge 1/ }).click()
  await expect(page.getByRole('heading', { name: 'Udsagn', exact: true })).toBeVisible()
  // one video per page, with what to learn, a summary and questions
  await expect(page.getByText('Side 1 af 4')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Det skal du lære' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Opsummering' })).toBeVisible()
  await page.getByRole('button', { name: 'Nej', exact: true }).first().click()
  await expect(page.getByText('Rigtigt!')).toBeVisible()
  await page.getByRole('button', { name: /Næste: Læs/ }).click()
  await expect(page.getByText('Side 2 af 4')).toBeVisible()
  await page.getByRole('tab', { name: /Læs/ }).click()
  await expect(page.getByText(/Trin 1 af/)).toBeVisible()
  await page.getByRole('tab', { name: 'Øvelser' }).click()
  await expect(page.getByText('Tjek dig selv')).toBeVisible()
  await page.locator('label.choice', { hasText: '7 er et primtal' }).click()
  await page.getByRole('button', { name: 'Tjek svar' }).click()
  await expect(page.getByText('Rigtigt!')).toBeVisible()

  // placement test, search and the course list all know the course
  await page.goto('/#/kursus/testkursus/test')
  await page.getByRole('button', { name: 'Start testen' }).click()
  await expect(page.getByText(/Uge 1: Udsagn/)).toBeVisible()
  await page.goto('/#/soeg?q=kvantor')
  await expect(page.getByText(/Testkursus i logik/).first()).toBeVisible()
  await page.goto('/#/kurser')
  await expect(page.getByText('Dit kursus')).toBeVisible()

  // a broken file is explained with line numbers and cannot be added
  await page.goto('/#/kurser/tilfoej')
  const broken = readFileSync(FIXTURE, 'utf8').replace('lang: da', 'lang: sv')
  await page.getByLabel('Kursusfil').setInputFiles({ name: 'fejl.md', mimeType: 'text/markdown', buffer: Buffer.from(broken) })
  await expect(page.getByText(/Linje 3:/)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Tilføj' })).toHaveCount(0)
})

test('a course added on one device appears on another device of the same learner', async ({ browser }) => {
  const cloud = fakeSupabase()
  const a = await browser.newContext()
  await cloud.attach(a)
  const pa = await a.newPage()
  await pa.goto('/#/kurser/tilfoej')
  await pa.getByLabel('Kursusfil').setInputFiles(FIXTURE)
  await pa.getByLabel('Forhåndsvisning').getByRole('button', { name: 'Tilføj' }).click({ timeout: 30_000 })
  await expect(pa.getByText('Kurset er gemt og kommer med på dine andre enheder.')).toBeVisible()
  expect(cloud.rows.get('testkursus')).toMatchObject({ title: 'Testkursus i logik', deleted: false })
  expect([...cloud.files.keys()]).toEqual(['00000000-0000-4000-8000-000000000001/testkursus.md'])
  expect(cloud.files.get('00000000-0000-4000-8000-000000000001/testkursus.md')).toBe(readFileSync(FIXTURE, 'utf8'))

  // second device: a fresh browser profile, logged in as the same learner
  const b = await browser.newContext()
  await cloud.attach(b)
  const pb = await b.newPage()
  await pb.goto('/#/indstillinger')
  await pb.getByRole('button', { name: 'Opdatér nu' }).click()
  await expect(pb.getByText(/Dine enheder er opdateret|Alt var allerede opdateret/)).toBeVisible({ timeout: 30_000 })
  await pb.goto('/#/kurser')
  await expect(pb.getByText('Testkursus i logik')).toBeVisible()
  await pb.goto('/#/kursus/testkursus/uge/2?fane=oev')
  await expect(pb.getByText('Øvelse 2.1')).toBeVisible()
  await a.close()
  await b.close()
})

test('a coding problem: run the examples in the browser, then submit to the judge', async ({ browser }) => {
  const cloud = fakeSupabase()
  const ctx = await browser.newContext({ locale: 'da-DK' })
  await cloud.attach(ctx)
  const page = await ctx.newPage()
  await page.goto('/#/kurser/tilfoej')
  await page.getByLabel('Kursusfil').setInputFiles(FIXTURE)
  const preview = page.getByLabel('Forhåndsvisning')
  await expect(preview.locator('.stat', { hasText: 'kodeopgaver' })).toContainText('1', { timeout: 30_000 })
  await preview.getByRole('button', { name: 'Tilføj' }).click({ timeout: 60_000 })
  await page.goto('/#/kode')
  await expect(page.getByText('Næste opgave')).toBeVisible()
  await page.getByRole('link', { name: /Tæl de sande udsagn/ }).first().click()
  await expect(page.getByText('Dommeren prøver også 2 skjulte tests.')).toBeVisible()
  const editor = page.getByRole('textbox', { name: 'Din kode' })
  await editor.fill('n = int(input())\nprint(sum(input().strip() == "sand" for _ in range(n)))\n')
  await page.getByRole('button', { name: '▶ Kør' }).click()
  await expect(page.getByText('1 af 1 eksempler bestået')).toBeVisible({ timeout: 60_000 })
  await page.getByRole('button', { name: 'Indsend' }).click()
  await expect(page.getByText('3 af 3 tests bestået')).toBeVisible()
  await expect(page.getByText('Skjult test 2')).toBeVisible()
  expect(cloud.judged.at(-1)).toMatchObject({ mode: 'submit', course: 'testkursus', problemId: 'testkursus/tael-sande', language: 'python' })
  await expect(page.getByRole('heading', { name: 'Dine indsendelser' })).toBeVisible()
  await page.goto('/#/kode')
  await expect(page.getByRole('link', { name: /Løst.*Tæl de sande udsagn/ })).toBeVisible()
  await ctx.close()
})

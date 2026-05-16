/**
 * Level loader — fetches JSON files from /public/levels/
 * Add new levels by dropping a JSON file in public/levels/
 * and adding an entry to public/levels/index.json.
 */

export async function fetchAllLevels() {
  const res = await fetch('/levels/index.json')
  const manifest = await res.json()

  const levels = await Promise.all(
    manifest.map(async ({ file }) => {
      const r = await fetch(`/levels/${file}`)
      return r.json()
    })
  )
  return levels
}

export async function fetchLevel(id) {
  const res = await fetch('/levels/index.json')
  const manifest = await res.json()
  const entry = manifest.find((m) => m.id === Number(id))
  if (!entry) return null
  const r = await fetch(`/levels/${entry.file}`)
  return r.json()
}
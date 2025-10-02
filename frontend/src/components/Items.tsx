import { useEffect, useState } from 'react'
import { api } from '../api'

type Item = { itemId: string; value: string; updatedAt: number }

export default function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [value, setValue] = useState('')

  async function refresh() {
    const r = await api('/v1/items')
    if (!r.ok) return
    const j = await r.json()
    setItems(j.items ?? [])
  }

  async function add() {
    const r = await api('/v1/items', { method: 'POST', body: JSON.stringify({ value }) })
    if (r.ok) { setValue(''); refresh() }
  }

  useEffect(() => { refresh() }, [])

  return (
    <div>
      <h2>Your Items</h2>
      <div>
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="Type a string" />
        <button onClick={add}>Add</button>
      </div>
      <ul>
        {items.map(i => (
          <li key={i.itemId}>{i.value}</li>
        ))}
      </ul>
    </div>
  )
}
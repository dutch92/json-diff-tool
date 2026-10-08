/** Prefix sums with O(log n) measurement updates and offset lookups. */
export class RowHeights {
  private values: number[]
  private tree: Float64Array

  constructor(estimates: number[]) {
    this.values = [...estimates]
    this.tree = new Float64Array(estimates.length + 1)
    for (let i = 1; i < this.tree.length; i++) {
      this.tree[i] += estimates[i - 1]
      const parent = i + (i & -i)
      if (parent < this.tree.length) this.tree[parent] += this.tree[i]
    }
  }

  reset(estimates: number[]) {
    const fresh = new RowHeights(estimates)
    this.values = fresh.values
    this.tree = fresh.tree
  }

  offset(index: number): number {
    let sum = 0
    for (let i = Math.min(index, this.values.length); i > 0; i -= i & -i) sum += this.tree[i]
    return sum
  }

  update(index: number, height: number): boolean {
    if (index < 0 || index >= this.values.length || height <= 0) return false
    const delta = height - this.values[index]
    if (Math.abs(delta) < 0.5) return false
    this.values[index] = height
    for (let i = index + 1; i < this.tree.length; i += i & -i) this.tree[i] += delta
    return true
  }

  indexAt(offset: number): number {
    let index = 0
    let sum = 0
    let step = 2 ** Math.floor(Math.log2(this.values.length || 1))
    for (; step >= 1; step /= 2) {
      const next = index + step
      if (next <= this.values.length && sum + this.tree[next] <= offset) {
        index = next
        sum += this.tree[next]
      }
    }
    return Math.min(index, Math.max(0, this.values.length - 1))
  }
}

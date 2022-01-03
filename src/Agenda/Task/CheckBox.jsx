export function CheckBox({ isFocused, task }) {
  return (
    <input
      type="checkbox"
      className="inline-block"
      checked={false}
      disabled={isFocused}
      onChange={() => task.complete()}
    />
  )
}

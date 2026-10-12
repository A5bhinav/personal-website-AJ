// 12 columns of 7x7px cells: "#" is a filled cell, "." an empty one.
// A little monitor with a ">_" prompt; swap in your own rows to change it.
const SPRITE = [
  "############",
  "#..........#",
  "#.#........#",
  "#..#.......#",
  "#.#..####..#",
  "#..........#",
  "############",
  "....####....",
  "..########..",
];

export function PixelSprite() {
  return (
    <div className="tp-claude-mascot" aria-hidden="true">
      {SPRITE.flatMap((row, y) =>
        [...row].map((cell, x) => (
          <span key={`${y}-${x}`} className={cell === "#" ? "tp-px tp-px--on" : "tp-px"} />
        )),
      )}
    </div>
  );
}

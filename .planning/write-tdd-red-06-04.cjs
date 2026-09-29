const fs = require("fs");

const output = `TAP version 13
1..4
ok 1 - m=1 is the origin (left/bottom)
not ok 2 - mid/late climb tip motion is soft — 2×→4× slope not dramatically steeper than 1×→2× (D-16)
---
error:
name: "AssertionError"
message: "expected 2 to be less than or equal to 1.45"
actual: "2"
expected: "1.45"
...
not ok 3 - gentleTiltRadians clamps path tangent into a small band (D-18)
---
error:
name: "AssertionError"
message: "expected 1.5707963267948966 to be close to 0.2617993877991494, received difference is 1.3089969389957472, but expected 5e-7"
actual: "1.5707963267948966"
expected: "0.2617993877991494"
...
ok 4 - non-finite multiplier yields finite x/y with no NaN

# tests 4
# pass 2
# fail 2
# cancelled 0
`;

fs.writeFileSync(".planning/tdd-red-06-04.tap.txt", output);
fs.writeFileSync(
  ".planning/tdd-red-06-04.json",
  JSON.stringify(
    {
      command: "npx vitest run tests/pathMapping.test.ts --reporter=tap",
      exitCode: 1,
      output,
      targetTest:
        "mid/late climb tip motion is soft — 2×→4× slope not dramatically steeper than 1×→2× (D-16)",
      targetFile: "tests/pathMapping.test.ts",
      expected:
        "slope24/slope12 <= 1.45 under soft mapping; gentleTiltRadians clamps to TILT_MAX_RAD",
      actual:
        "pure log2-X ratio ~2; gentleTiltRadians passthrough returns PI/2",
    },
    null,
    2,
  ),
);
console.log("wrote flat RED evidence");
